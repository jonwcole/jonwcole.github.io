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
      wrapper.setAttribute('class', 'job-category-wrapper margin-bottom---s');
      const category = document.createElement('h2');
      category.textContent = department.name;
      category.setAttribute('class', 'headline m margin-bottom---xs');
      const jobGroup = document.createElement('div');
      jobGroup.setAttribute('class', 'column-wrapper margin-offset---xs');

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
        jobEntry.setAttribute('class', 'column third padding---xs whole-mob');

        const jobCard = document.createElement('a');
        jobCard.setAttribute('href', job.url);
        jobCard.setAttribute('class', 'card-wrapper border-radius-s link-block');

        const position = document.createElement('h3');
        // position.setAttribute('href', job.url);
        position.setAttribute('class', 'headline s regular medium margin-bottom---5');
        position.textContent = job.title;

        const locations = document.createElement('div');

        const locationsWrapper = document.createElement('div');
        locationsWrapper.setAttribute('class', 'text-m margin-bottom---xs')
        
        job.locations.sort(function(locationA, locationB) {
          if(locationA.name < locationB.name) { return -1; }
          if(locationA.name > locationB.name) { return 1; }
          return 0;
        }).forEach(function(location, index) {
          const jobLocation = locations.appendChild( document.createElement('span') )
          jobLocation.textContent = location.name
          // jobLocation.setAttribute('href', location.url);
          jobLocation.setAttribute('class', '')

          if(job.locations.length -1 !== index) {
            const spacer = locations.appendChild(document.createElement('span'))
            spacer.textContent = " | "
          }
        });

        const cta = document.createElement('div');
        cta.setAttribute('class', 'cta text-m margin-top---auto');
        cta.textContent = "View position";

        const columnWrapper = document.createElement('div');
        columnWrapper.setAttribute('class', 'column-wrapper flex align-center full-height');

        const column = document.createElement('div');
        column.setAttribute('class', 'column auto-col padding---30 full-height flex vertical');

        jobGroup.appendChild(jobEntry);
        jobEntry.appendChild(jobCard);
        jobCard.appendChild(columnWrapper);
        columnWrapper.appendChild(column);
        column.appendChild(position);
        column.appendChild(locationsWrapper);
        locationsWrapper.appendChild(locations);
        column.appendChild(cta);
      })

      wrapper.appendChild(category);
      wrapper.appendChild(jobGroup);
      section.appendChild(wrapper);
    });
  }
})();