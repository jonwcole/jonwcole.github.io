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
      category.setAttribute('class', 'headline l margin-bottom---xs');
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
        position.setAttribute('class', 'headline s regular medium margin-bottom---xxs');
        position.textContent = job.title;

        const locations = document.createElement('div');
        
        job.locations.sort(function(locationA, locationB) {
          if(locationA.name < locationB.name) { return -1; }
          if(locationA.name > locationB.name) { return 1; }
          return 0;
        }).forEach(function(location, index) {
          const jobLocation = locations.appendChild( document.createElement('div') )
          jobLocation.textContent = location.name
          // jobLocation.setAttribute('href', location.url);
          jobLocation.setAttribute('class', 'job-data location')

          if(job.locations.length -1 !== index) {
            const spacer = locations.appendChild(document.createElement('span'))
            spacer.textContent = " | "
          }
        });

        const type = document.createElement('div');
        type.setAttribute('class', 'job-data type');
        type.textContent = "[Remote, Hybrid, On-Site]";

        const departmentName = document.createElement('div');
        departmentName.setAttribute('class', 'job-data department');
        departmentName.textContent = department.name;

        const description = document.createElement('div');
        description.setAttribute('class', 'text-m margin-bottom---xxs');
        description.textContent = "[description]";

        const cta = document.createElement('div');
        cta.setAttribute('class', 'cta text-m desktop-and-tablet-only');
        cta.textContent = "View position";

        const columnWrapper = document.createElement('div');
        columnWrapper.setAttribute('class', 'column-wrapper flex align-center');

        const columnLeft = document.createElement('div');
        columnLeft.setAttribute('class', 'column auto-col padding---s padding-bottom-mob---0');

        const columnRight = document.createElement('div');
        columnRight.setAttribute('class', 'column _4-col padding---xs whole-mob padding-top-mob---0');


        jobGroup.appendChild(jobEntry);
        jobEntry.appendChild(jobCard);
        jobCard.appendChild(columnWrapper);
        columnWrapper.appendChild(columnLeft);
        columnWrapper.appendChild(columnRight);
        columnLeft.appendChild(position);
        columnLeft.appendChild(description);
        columnLeft.appendChild(cta);
        columnRight.appendChild(departmentName);
        columnRight.appendChild(type);
        columnRight.appendChild(locations);
      })

      wrapper.appendChild(category);
      wrapper.appendChild(jobGroup);
      section.appendChild(wrapper);
    });
  }
})();