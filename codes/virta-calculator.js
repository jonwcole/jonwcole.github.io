$(document).ready(function() {
	// When clicking the submit button
  $('#submit').click(function() {
		// The value from the inputs
    let firstName = $('#first-name').val();
    let lastName = $('#last-name').val();
    let emailAddress = $('#email-address').val();
    let weight = $('#weight').val();
    let feet = $('#height-feet').val();
    let inches = $('#height-inches').val();
    let hba1c = $('#hba1c').val();
    let employer = $('#employer').val();
		const checkBoxInsulin = $("#checkbox-insulin").is(":checked");
    const checkBoxSulfonylureas = $("#checkbox-sulfonylureas").is(":checked");
    const checkBoxGlp1 = $("#checkbox-glp1").is(":checked");
    const checkBoxSglt2 = $("#checkbox-sglt2").is(":checked");
    const checkBoxDpp4 = $("#checkbox-dpp4").is(":checked");
    const checkBoxTzd = $("#checkbox-tzd").is(":checked");
    const checkBoxNone = $("#checkbox-none").is(":checked");

    const checkboxVals = [
       checkBoxInsulin,
       checkBoxSulfonylureas,
       checkBoxGlp1,
       checkBoxSglt2,
       checkBoxDpp4,
       checkBoxTzd,
       checkBoxNone,
    ];
		
    localStorage.clear();
    
	// Storing the values in localStorage
    localStorage.setItem('first-name', firstName);
    localStorage.setItem('email-address', emailAddress);
	localStorage.setItem('last-name', lastName);
    localStorage.setItem('weight', weight);
    localStorage.setItem('height-feet', feet);
    localStorage.setItem('height-inches', inches);
    localStorage.setItem('hba1c', hba1c);
    localStorage.setItem('employer', employer);
	localStorage.setItem("checkboxVals", checkboxVals);    

	// Log it to the console
	console.log(firstName, emailAddress);







// results









const checkboxVals = localStorage
    .getItem("checkboxVals")
    .split(",")
    .map((val) => val === "true");
  const [
    includeInsulin,
    includeSulfonylurea,
    includeGlp1,
    includeSglt2,
    includeDpp4,
    includeTzd,
    includeNone,
  ] = checkboxVals;

  const replaceTagWithText = (elementId, tag, replacement) => {
    const element = $(elementId);
    const textToReplace = element.html();
    const newText = textToReplace.replaceAll(tag, replacement);
    element.html(newText);
  };

  const roundToTenths = (val) => Math.round(val * 10) / 10;

  const calculateA1cReduction = (a1c) => {
    if (a1c > 12.0) {
      return 5.7;
    } else if (a1c > 10.0 && a1c <= 12.0) {
      return 3.4;
    } else if (a1c > 8.5 && a1c <= 10.0) {
      return 1.9;
    } else if (a1c > 7.5 && a1c <= 8.5) {
      return 1.2;
    } else if (a1c > 6.5 && a1c <= 7.5) {
      return 0.7;
    } else if (a1c > 5.6 && a1c <= 6.5) {
      return 0.3;
    } else {
      return 0;
    }
  };

  const calculateBmi = (weight, heightFeet, heightInches) => {
    const totalHeightInches = heightFeet * 12 + heightInches;
    const bmi = roundToTenths(
      (703 * weight) / (totalHeightInches * totalHeightInches)
    );
    return bmi;
  };

  const calculateWeightReduction = (
    weight,
    heightFeet,
    heightInches,
    a1c
  ) => {
    const bmi = calculateBmi(weight, heightFeet, heightInches);
    if (bmi > 34.9) {
      weight_reduction_perc = 0.062;
    } else if (bmi > 29.9 && a1c <= 34.9) {
      weight_reduction_perc = 0.058;
    } else if (bmi > 24.9 && a1c <= 29.9) {
      weight_reduction_perc = 0.049;
    } else if (bmi > 18.4 && a1c <= 24.9) {
      weight_reduction_perc = 0.029;
    } else {
      weight_reduction_perc = 0.0; /* Let’s not populate animation */
    }
    return weight_reduction_perc;
  };

  const calculateCostSavings = (
    includeInsulin,
    includeSulfonylurea,
    includeGlp1,
    includeSglt2,
    includeDpp4,
    includeTzd,
    includeNone
  ) => {
    let costSavings = 0;
    if (includeNone) {
      return costSavings;
    }
    if (includeInsulin) {
      costSavings += 420;
    }
    if (includeSulfonylurea) {
      costSavings += 71;
    }
    if (includeGlp1) {
      costSavings += 2206;
    }
    if (includeSglt2) {
      costSavings += 1493;
    }
    if (includeDpp4) {
      costSavings += 1375;
    }
    if (includeTzd) {
      costSavings += 136;
    }
    return costSavings;
  };

  const hideMedicationDivs = (
    includeInsulin,
    includeSulfonylurea,
    includeGlp1,
    includeSglt2,
    includeDpp4,
    includeTzd,
    includeNone
  ) => {
    let section;
    if (includeNone) {
      // Hide entire medications section
      section = $("#med-reductions");
      section.hide();
      return;
    }
    if (!includeInsulin) {
      section = $("#insulin-reduction");
      section.hide();
    }
    if (!includeSulfonylurea) {
      section = $("#sulfonylurea-reduction");
      section.hide();
    }
    if (!includeGlp1) {
      section = $("#glp1-reduction");
      section.hide();
    }
    if (!includeSglt2) {
      section = $("#sglt2-reduction");
      section.hide();
    }
    if (!includeDpp4) {
      section = $("#dpp4-reduction");
      section.hide();
    }
    if (!includeTzd) {
      section = $("#tzd-reduction");
      section.hide();
    }
  };

  // Entering the localStorage value in each input
  const firstName = localStorage.getItem("first-name");
  const emailAddress = $("#emailAddress").val(
    localStorage.getItem("email-address")
  );
  const lastName = localStorage.getItem("last-name");
  const weight = parseFloat(localStorage.getItem("weight"));
  const feet = parseInt(localStorage.getItem("height-feet"));
  const inches = parseInt(localStorage.getItem("height-inches"));
  const hba1c = parseFloat(localStorage.getItem("hba1c"));
  const employer = localStorage.getItem("employer");

  const weightReductionProportion = calculateWeightReduction(
    weight,
    feet,
    inches,
    hba1c
  );
  const weightReductionPercentage = roundToTenths(
    parseFloat(weightReductionProportion * 100)
  );
  const weightReduction = roundToTenths(weightReductionProportion * weight);
  const potentialWeight = roundToTenths(weight - weightReduction);
  const a1cReduction = calculateA1cReduction(hba1c);
  const potentialHba1c = roundToTenths(hba1c - a1cReduction);
  const belowThreshold = "";
  const costSavings = calculateCostSavings(...checkboxVals);

  // Show/Hide medication sections based on checkbox values
  hideMedicationDivs(...checkboxVals);

  // Replacing tags with their dynamic values from the forms/calculations
  replaceTagWithText("#prediction-heading", "{first_name}", firstName);
  replaceTagWithText("#hba1c-prediction", "{hba1c}", hba1c);
  replaceTagWithText("#hba1c-prediction", "{potential-hba1c}", potentialHba1c);
  replaceTagWithText("#weight-prediction", "{weight}", weight);
  replaceTagWithText("#weight-prediction", "{potential-weight}", potentialWeight);
  replaceTagWithText("#cost-savings", "{cost_savings}", costSavings);
  replaceTagWithText("#hba1c-prediction", "{a1c_reduction}", a1cReduction);
  replaceTagWithText("#weight-prediction", "{weight_reduction_perc}", weightReductionPercentage);
  replaceTagWithText("#weight-prediction", "{weight_reduction}", weightReduction);
  replaceTagWithText("#weight-prediction", "{potential_weight}", potentialWeight);

  });
});