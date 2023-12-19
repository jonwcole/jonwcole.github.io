(function() {
  const section = document.querySelector('.jobs-container');
  let requestURL = 'https://api.greenhouse.io/v1/boards/ketryx/embed/departments';
  let request = new XMLHttpRequest();
  request.open('GET', requestURL);
  request.responseType = 'json';
  request.send();
  request.onload = function() {
    const greenhouseScript = request.response;
    showJobs(greenhouseScript);
  };
  function showJobs(jsonObj) {
    const greenhouse = jsonObj['departments'].filter(function(dep) {
      return dep.jobs.length > 0;
    });
    greenhouse.forEach(function(department) {
      const wrapper = document.createElement('div');
      const category = document.createElement('h2');
      category.textContent = department.name;
      category.setAttribute('class', 'headline l margin-bottom---s');
      const jobGroup = document.createElement('div');
      const horizontalRule = document.createElement('div');
      horizontalRule.setAttribute('class', 'horizontal-rule margin-bottom---s');

      const groupedJobs = department.jobs.reduce(function(acc, job) {

        if(acc[job.title]) {
          acc[job.title].locations.push({
            name: job.location.name,
            url: job.absolute_url
          }) 
        } else {
          acc[job.title] = {
            title: job.title,
            url: job.absolute_url,
            locations: [{
              name: job.location.name,
              url: job.absolute_url
            }]
          }
        }

        return acc
      }, {});

      Object.keys(groupedJobs).forEach(function(jobKey) {
        const job = groupedJobs[jobKey]
        const jobEntry = document.createElement('div');
        jobEntry.setAttribute('class', 'card-wrapper border-radius-s padding---s');

        const position = document.createElement('h3');
        // position.setAttribute('href', job.url);
        position.setAttribute('class', 'headline s regular medium margin-bottom---xxs');
        position.textContent = job.title;

        const locations = document.createElement('div');
        
        job.locations.sort(function(locationA, locationB) {
          if(locationA.name < locationB.name) { return -1; }
          if(locationA.name > locationB.name) { return 1; }
          return 0;
        }).forEach(function(location, index) {
          const link = locations.appendChild( document.createElement('a') )
          link.textContent = location.name
          link.setAttribute('href', location.url);
          link.setAttribute('class', 'location-link')

          if(job.locations.length -1 !== index) {
            const spacer = locations.appendChild(document.createElement('span'))
            spacer.textContent = " | "
          }
        });

        jobEntry.appendChild(position);
        jobGroup.appendChild(jobEntry);
        jobEntry.appendChild(locations);
      })

      wrapper.appendChild(category);
      wrapper.appendChild(jobGroup);
      wrapper.appendChild(horizontalRule);
      section.appendChild(wrapper);
    });
  }
})();