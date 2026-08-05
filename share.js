(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('share')!=='1')return;
  document.body.classList.add('share-mode');
  const banner=document.createElement('div');
  banner.className='share-banner';
  banner.innerHTML='<span>Holleman Command Center — Read-Only Preview</span><small>Viewing is enabled; editing and local data changes are disabled.</small>';
  document.body.prepend(banner);
  const blocked=['saveData','saveMetrics','saveBriefing','createEvent','removeEvent','resetData','importData','togglePriority','toggleCareerPriority','saveCareerMetrics','updateCareerDocument','addCareerOpportunity','updateCareerOpportunity','removeCareerOpportunity','addNetworkContact','updateNetwork','removeNetwork','addSkill','updateSkill','removeSkill','addStory','updateStory','removeStory','addAchievement','updateAchievement','removeAchievement','saveLinkedIn','addLiveJobToPipeline','saveCalendarConnection','disconnectCalendar'];
  blocked.forEach(name=>{if(typeof window[name]==='function')window[name]=function(){toast('Read-only preview: changes are disabled.')}});
  document.addEventListener('change',e=>{
    if(e.target.matches('input,textarea,select')){
      e.preventDefault();
      toast('Read-only preview: changes are disabled.');
      if(e.target.type==='checkbox')e.target.checked=!e.target.checked;
    }
  },true);
})();