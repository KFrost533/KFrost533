$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Net.Http
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rootDirectory = Split-Path -Parent $PSScriptRoot
$readmeFiles = @("README.md", "README_JP.md")
$links = [System.Collections.Generic.List[object]]::new()
$script:readmeMissingCount = 0

function Add-DiscoveredLink {
    param(
        [string]$FileName,
        [string]$Content,
        [int]$Index,
        [string]$Target
    )

    $cleanTarget = $Target.Trim().Trim("<", ">")
    if ([string]::IsNullOrWhiteSpace($cleanTarget)) {
        return
    }

    $lineNumber = ($Content.Substring(0, $Index).Split("`n")).Length
    $links.Add([pscustomobject]@{
        FileName = $FileName
        LineNumber = $lineNumber
        Target = $cleanTarget
    })
}

function Get-MarkdownLinks {
    param([string]$FileName)

    $filePath = Join-Path $rootDirectory $FileName
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        $script:readmeMissingCount++
        Write-Host "[FAIL] $FileName is missing."
        return
    }

    $content = [System.IO.File]::ReadAllText($filePath)
    $content = [regex]::Replace($content, '(?ms)^\s*(?<fence>```|~~~)[^\r\n]*\r?\n.*?^\s*\k<fence>\s*$', '')
    $content = [regex]::Replace($content, '(?s)<!--.*?-->', '')
    $content = [regex]::Replace($content, '`[^`]*`', '')

    $patterns = @(
        '(?s)!?\[[^\]]*\]\(\s*(?<target><[^>\r\n]+>|[^\s)]+)',
        '(?m)^\s*\[[^\]]+\]:\s*(?<target><[^>\r\n]+>|[^\s]+)',
        '(?i)\b(?:href|src)\s*=\s*["''](?<target>[^"'']+)["'']',
        '(?i)<(?<target>https?://[^>\s]+)>',
        '(?i)\bhttps?://[^\s<>"'')]+'
    )

    foreach ($pattern in $patterns) {
        foreach ($match in [regex]::Matches($content, $pattern)) {
            if ($match.Groups["target"].Success) {
                Add-DiscoveredLink $FileName $content $match.Groups["target"].Index $match.Groups["target"].Value
            } else {
                Add-DiscoveredLink $FileName $content $match.Index $match.Value
            }
        }
    }
}

function Test-CaseSensitivePathExists {
    param([string]$Path)

    $fullPath = [System.IO.Path]::GetFullPath($Path)
    $currentPath = [System.IO.Path]::GetPathRoot($fullPath)
    $segments = $fullPath.Substring($currentPath.Length).Split(
        [char[]]@([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar),
        [System.StringSplitOptions]::RemoveEmptyEntries
    )

    foreach ($segment in $segments) {
        if (-not (Test-Path -LiteralPath $currentPath -PathType Container)) {
            return $false
        }

        $matchingChild = Get-ChildItem -LiteralPath $currentPath -Force |
            Where-Object { $_.Name -ceq $segment } |
            Select-Object -First 1
        if ($null -eq $matchingChild) {
            return $false
        }

        $currentPath = $matchingChild.FullName
    }

    return $true
}

foreach ($readmeFile in $readmeFiles) {
    Get-MarkdownLinks $readmeFile
}

$uniqueLinks = $links |
    Sort-Object FileName, LineNumber, Target -Unique
$httpHandler = [System.Net.Http.HttpClientHandler]::new()
$httpHandler.AllowAutoRedirect = $true
$httpHandler.MaxAutomaticRedirections = 10
$httpClient = [System.Net.Http.HttpClient]::new($httpHandler)
$httpClient.Timeout = [TimeSpan]::FromSeconds(20)
$httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("KFrost533-README-Link-Checker/1.0")

$failedCount = $script:readmeMissingCount
$warningCount = 0
$checkedCount = 0

try {
    foreach ($link in $uniqueLinks) {
        $target = $link.Target.TrimEnd(".", ",", ";")
        $schemeMatch = [regex]::Match($target, '^(?<scheme>[a-zA-Z][a-zA-Z0-9+.-]*):')

        if ($schemeMatch.Success -and $schemeMatch.Groups["scheme"].Value -notin @("http", "https")) {
            Write-Host ("[SKIP] {0}:{1} -> {2} (non-HTTP link)" -f $link.FileName, $link.LineNumber, $target)
            continue
        }

        if ($target.StartsWith("//")) {
            $target = "https:$target"
        }

        if ($target -match '^https?://') {
            $checkedCount++
            try {
                $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $target)
                $response = $httpClient.SendAsync(
                    $request,
                    [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead
                ).GetAwaiter().GetResult()

                try {
                    $statusCode = [int]$response.StatusCode
                    if ($statusCode -ge 200 -and $statusCode -lt 400) {
                        Write-Host ("[OK]   {0}:{1} -> {2} (HTTP {3})" -f $link.FileName, $link.LineNumber, $target, $statusCode)
                    } elseif ($statusCode -in @(404, 410)) {
                        $failedCount++
                        Write-Host ("[FAIL] {0}:{1} -> {2} (HTTP {3}, Not Found)" -f $link.FileName, $link.LineNumber, $target, $statusCode)
                    } elseif ($statusCode -in @(401, 403, 429) -or $statusCode -ge 500) {
                        $warningCount++
                        Write-Host ("[WARN] {0}:{1} -> {2} (HTTP {3}; could not confirm availability)" -f $link.FileName, $link.LineNumber, $target, $statusCode)
                    } else {
                        $failedCount++
                        Write-Host ("[FAIL] {0}:{1} -> {2} (HTTP {3})" -f $link.FileName, $link.LineNumber, $target, $statusCode)
                    }
                } finally {
                    $response.Dispose()
                    $request.Dispose()
                }
            } catch {
                $warningCount++
                Write-Host ("[WARN] {0}:{1} -> {2} ({3})" -f $link.FileName, $link.LineNumber, $target, $_.Exception.Message)
            }
            continue
        }

        if ($schemeMatch.Success) {
            Write-Host ("[SKIP] {0}:{1} -> {2} (unsupported scheme)" -f $link.FileName, $link.LineNumber, $target)
            continue
        }

        $parts = $target.Split("#", 2)
        $relativePath = [Uri]::UnescapeDataString(($parts[0] -split "\?", 2)[0])
        $fragment = if ($parts.Length -gt 1) { [Uri]::UnescapeDataString($parts[1]) } else { "" }
        $sourcePath = Join-Path $rootDirectory $link.FileName
        if ([string]::IsNullOrWhiteSpace($relativePath)) {
            $resolvedPath = $sourcePath
        } else {
            $relativePath = $relativePath.Replace("/", [System.IO.Path]::DirectorySeparatorChar)
            $resolvedPath = [System.IO.Path]::GetFullPath((Join-Path $rootDirectory $relativePath))
        }

        $rootPrefix = [System.IO.Path]::GetFullPath($rootDirectory) + [System.IO.Path]::DirectorySeparatorChar
        if ($resolvedPath -ne $rootDirectory -and
            $resolvedPath -ne $sourcePath -and
            -not $resolvedPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            $failedCount++
            Write-Host ("[FAIL] {0}:{1} -> {2} (path escapes repository)" -f $link.FileName, $link.LineNumber, $target)
        } elseif (-not (Test-CaseSensitivePathExists $resolvedPath)) {
            $failedCount++
            Write-Host ("[FAIL] {0}:{1} -> {2} (local path missing or has incorrect casing)" -f $link.FileName, $link.LineNumber, $target)
        } else {
            $checkedCount++
            Write-Host ("[OK]   {0}:{1} -> {2} (local path exists)" -f $link.FileName, $link.LineNumber, $target)
        }
    }
} finally {
    $httpClient.Dispose()
    $httpHandler.Dispose()
}

Write-Host ""
Write-Host ("Checked: {0}; broken: {1}; could not verify: {2}" -f $checkedCount, $failedCount, $warningCount)

if ($failedCount -gt 0) {
    exit 1
}
if ($warningCount -gt 0) {
    exit 2
}
exit 0
