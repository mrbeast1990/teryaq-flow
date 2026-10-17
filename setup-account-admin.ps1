$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$secureCode = Read-Host 'New Flow administration code (at least 8 characters)' -AsSecureString
$secureConfirm = Read-Host 'Confirm administration code' -AsSecureString
$codePointer = [IntPtr]::Zero
$confirmPointer = [IntPtr]::Zero
try {
  $codePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureCode)
  $confirmPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureConfirm)
  $plainCode = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($codePointer)
  $plainConfirm = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmPointer)
  if ($plainCode.Length -lt 8 -or $plainCode.Length -gt 128 -or $plainCode -cne $plainConfirm) {
    throw 'Codes must match and contain 8 to 128 characters.'
  }
  $directory = Join-Path $ProjectRoot '.data\account-administration'
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
  $acl = New-Object Security.AccessControl.DirectorySecurity
  $owner = [Security.Principal.WindowsIdentity]::GetCurrent().User
  $acl.SetOwner($owner)
  $acl.SetAccessRuleProtection($true, $false)
  $rule = New-Object Security.AccessControl.FileSystemAccessRule($owner, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
  $acl.AddAccessRule($rule)
  Set-Acl -LiteralPath $directory -AclObject $acl
  $start = New-Object Diagnostics.ProcessStartInfo
  $start.FileName = 'node'
  $start.Arguments = 'scripts/set-account-admin.mjs'
  $start.WorkingDirectory = $ProjectRoot
  $start.UseShellExecute = $false
  $start.CreateNoWindow = $true
  $start.RedirectStandardInput = $true
  $start.StandardInputEncoding = New-Object Text.UTF8Encoding($false)
  $process = [Diagnostics.Process]::Start($start)
  $process.StandardInput.Write($plainCode)
  $process.StandardInput.Close()
  $plainCode = $null
  $plainConfirm = $null
  $process.WaitForExit()
  if ($process.ExitCode -ne 0) { throw 'Administration code setup failed.' }
} finally {
  if ($codePointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($codePointer) }
  if ($confirmPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmPointer) }
  $plainCode = $null
  $plainConfirm = $null
  $secureCode.Dispose()
  $secureConfirm.Dispose()
}
