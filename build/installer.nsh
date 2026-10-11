; Tuzfalszabaly: a telefon a helyi halozaton a 7010-es porton eri el a gepet.
!macro customInstall
  nsExec::Exec 'netsh advfirewall firewall delete rule name="BindDeck"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="BindDeck" dir=in action=allow protocol=TCP localport=7010'
!macroend

!macro customUnInstall
  nsExec::Exec 'netsh advfirewall firewall delete rule name="BindDeck"'
!macroend
