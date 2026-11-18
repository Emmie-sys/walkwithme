$ErrorActionPreference='Stop'
$log='H:\walkwithme\project_sta.log'
try {
  $q=New-Object -ComObject MSProject.Application
  $q.Visible=$false
  "version=$($q.Version) preprojects=$($q.Projects.Count)" | Set-Content $log
  $ok=$q.FileOpenEx('H:\walkwithme\ACMIS_readonly_copy.mpp',$true)
  "open=$ok" | Add-Content $log
  Start-Sleep -Seconds 5
  "projects=$($q.Projects.Count) active=$($q.ActiveProject.Name) tasks=$($q.ActiveProject.Tasks.Count) resources=$($q.ActiveProject.Resources.Count) assignments=$($q.ActiveProject.Assignments.Count) start=$($q.ActiveProject.ProjectStart) finish=$($q.ActiveProject.ProjectFinish) status=$($q.ActiveProject.StatusDate)" | Add-Content $log
} catch { "ERROR=$($_.Exception.Message)" | Add-Content $log }
