Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

batPath = scriptDir & "\folios.bat"
exePath = scriptDir & "\dist\folio-alert.exe"

If fso.FileExists(batPath) Then
    cmdHidden = "cmd /c cd /d " & Chr(34) & scriptDir & Chr(34) & " && start " & Chr(34) & Chr(34) & " /b " & Chr(34) & batPath & Chr(34)
    exitCode = WshShell.Run(cmdHidden, 0, True)
    If exitCode <> 0 Then
        cmdVisible = "cmd /k cd /d " & Chr(34) & scriptDir & Chr(34) & " && " & Chr(34) & batPath & Chr(34)
        WshShell.Run cmdVisible, 1, True
    End If
ElseIf fso.FileExists(exePath) Then
    cmdHidden = "cmd /c cd /d " & Chr(34) & scriptDir & Chr(34) & " && start " & Chr(34) & Chr(34) & " /b " & Chr(34) & exePath & Chr(34)
    exitCode = WshShell.Run(cmdHidden, 0, True)
    If exitCode <> 0 Then
        cmdVisible = "cmd /k cd /d " & Chr(34) & scriptDir & Chr(34) & " && " & Chr(34) & exePath & Chr(34)
        WshShell.Run cmdVisible, 1, True
    End If
Else
    cmdHidden = "cmd /c cd /d " & Chr(34) & scriptDir & Chr(34) & " && where node >nul 2>nul && start " & Chr(34) & Chr(34) & " /b node index.js || exit /b 1"
    exitCode = WshShell.Run(cmdHidden, 0, True)
    If exitCode <> 0 Then
        cmdVisible = "cmd /k cd /d " & Chr(34) & scriptDir & Chr(34) & " && node index.js"
        WshShell.Run cmdVisible, 1, True
    End If
End If

Set fso = Nothing
Set WshShell = Nothing


