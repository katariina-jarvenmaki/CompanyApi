/**
 * Function for fetching data from external PRH REST API
 * 
 * @param app, General access to the app
 * @param database, Generall access to the database
 * @return {json} Shows json on the screen
 * */
function showNewestJsonFromPrh(app, database) {

    // Settings for fetch
    const urlParams = ":companyId";
    const apiRoute = "/api/company/"+urlParams;
    const fetchUrl = "https://avoindata.prh.fi/bis/v1/";
    const fetchOptions = {
        "method": "GET",
    };

    // Get request
    app.get(apiRoute, async (req, res) => {

        // Verify businessId before fetch
        if(!validateBusinessId(req.params.companyId)) {
            return res.status(400).json({
                error: "Invalid businessId given"
            });
        }

        // Then fetch data
        try {

            // Loading modules for fetch
            const fetch = require("node-fetch");

            // Settings for fetch
            const url = fetchUrl+req.params.companyId;
            console.log("Fetch data from endpoint");
    
            // Defining fetch
            const response = await fetch(url, fetchOptions)
                .then(res => res.json())
                .catch(e => {
                  console.error({
                    "message": "oh noes, fetch failed",
                    error : e,
                });
            });
            // console.log("RESPONSE ", response);

            // Get data from fetch
            const newdata = response.results[0];

            // Define variables DB-values
            var savedata, name, address, phone, website, updateDate, checker;
            const businessId = newdata.businessId;

            // Get the savedata from database
            const sql = `SELECT * FROM companies WHERE businessId = '${businessId}'`;
            database.all(sql, [], (err, rows) => {
                // If connection fails
                if(err) return console.error(err.message);
                // If rows are found
                if(rows.length > 0) {
                    rows.forEach(row => {
                        name = row.name;
                        address = row.address;
                        phone = row.phone;
                        website = row.website;
                        updateDate = row.updateDate;
                        checker = "found";
                    });
                }
                // If no result
                else { checker = "empty"; }
            });

            // Wait for query result 
            function waitForQueryResult() {
                // If checker is defined
                if(typeof checker !== "undefined") {
                    // if save found
                    if(checker == "found") {
                        // Define the save
                        savedata = { // Make sure these are selected by businessID so they wont mix
                            "businessId": businessId,
                            "name": name,
                            "address": address,
                            "phone": phone,
                            "website": website,
                            "updateDate": updateDate
                        }
                        console.log("Save was found");
                    }
                    // if save not found
                    else {
                        // Define the save
                        savedata = { // Make sure these are selected by businessID so they wont mix
                            "businessId": businessId
                        }
                        console.log("No save found");
                    }
                } 
                // Run function again
                else {
                    setTimeout(waitForQueryResult, 250);
                }
            };
            waitForQueryResult();

            // After the get save
            function waitForGetSave() {

                // If save is defined
                if(typeof savedata !== "undefined") {

                    // Prosessing data
                    const updateDate = getCurrentDate();
                    const businessName = getNewestBusinessName(newdata, savedata);
                    const businessAddress = getNewestBusinessAddress(newdata, savedata);
                    const businessPhone = getNewestBusinessPhone(newdata, savedata);
                    const businessWebsite = getNewestBusinessWebsite(newdata, savedata);

                    // Save doesn't exist
                    if(checker == "empty") {

                        // Insert to database
                        const sql = `INSERT INTO companies (businessId, name, address, phone, website, updateDate)
                            VALUES (?, ?, ?, ?, ?, ?)`;
                        database.run(sql, [businessId, businessName, businessAddress, businessPhone, businessWebsite, updateDate], (err) => {
                            if(err) return console.error(err.message);
                            // console.log("New row has been created");
                        });
                    }

                    // Save exits
                    if(checker == "found") {

                        // Update to database
                        const sql = `UPDATE companies SET name = ?, address = ?, phone = ?, website = ?, updateDate = ?
                            WHERE businessId = '${businessId}'`;
                        database.run(sql, [businessName, businessAddress, businessPhone, businessWebsite, updateDate], (err) => {
                            if(err) return console.error(err.message);
                            // console.log("Row has been updated");
                        });
                    }

                    // Build result
                    const onlynewest = {
                        "businessId": businessId,
                        "name": businessName,
                        "address": businessAddress,
                        "phone": businessPhone,
                        "website": businessWebsite
                    }
    
                    // Show result
                    res.json(onlynewest);
                }
                else {
                    setTimeout(waitForGetSave, 250);
                }
            }
            waitForGetSave();
        }
        catch (err) {
            return console.error(err.message);
        }
    });
}
// Exports to outside of the module
module.exports.showNewestJsonFromPrh = showNewestJsonFromPrh;

/**
 * Function for getting current date
 * 
 * @return {String} Current date
 * */
 function getCurrentDate() {

    // Define new date
    const rawDate = new Date();

    // Modify month to two digets
    let month = rawDate.getMonth()+1;
    if(rawDate.getMonth() < 9) { month = "0"+month; }

    // Modify day to two digets
    let day = rawDate.getDate();
    if(rawDate.getDate() < 10) { day = "0"+day; }

    // Finalize date
    const date = rawDate.getFullYear() + "-" + month + "-" + day;
    return date;
}

/**
 * Function for validating business id
 * 
 * @param {String} businessId, id to verify
 * */
const validateBusinessId = (businessId) => {
    // General checks
    if(!businessId) return false;
    if(businessId.length !== 9) return false;
    if(businessId == "undefined") return false;
    // Check first 7 characters
    let numbers = [...businessId.substring(0,7)];
    if(!numbers.every(c => '0123456789'.includes(c))) return false;
    // Check the mark
    if(businessId[7] !== '-') return false;
    // Multipliers
    const multipliers = [7,9,10,5,8,4,2];
    let checkSum = 0;
    let checkMark = '';
    for (i = 0; i < multipliers.length; i++) {
        checkSum += multipliers[i] * numbers[i];
    }
    let remainder = checkSum % 11;
    if(remainder == 1) {
        return false; // businessId not in use if remainder is 1
    } else if(remainder > 1) {
        checkMark = 11 - remainder;
    } else {
        checkMark = remainder;
    }
    // Result
    return Number(businessId[8]) === checkMark;
}

/**
 * Function for validating business name
 * 
 * @param {String} businessName, value to verify
 * */
 const validateBusinessName = (businessName) => {
    // General checks
    if(!businessName) return false;
    if(businessName.length < 1) return false;
    if(businessName == "undefined") return false;
    // Check characters
    let characters = [...businessName.substring(0,businessName.length)];
    if(!characters.every(c => '0123456789ABCDEFGHIJKLMNOPQRSŠTUVWXYZŽÅÄÖabcdefghijklmnopqrsštuvwxyzžåäö ,.-'.includes(c))) return false;
    // Result
    return true;
}

/**
 * Function for validating business address
 * 
 * @param {String} businessAddress, value to verify
 * */
 const validateBusinessAddress = (businessAddress) => {
    // General checks
    if(!businessAddress) return false;
    if(businessAddress.length < 1) return false;
    if(businessAddress == "undefined") return false;
    // Check characters
    let characters = [...businessAddress.substring(0,businessAddress.length)];
    if(!characters.every(c => '0123456789ABCDEFGHIJKLMNOPQRSŠTUVWXYZŽÅÄÖabcdefghijklmnopqrsštuvwxyzžåäö ,.-'.includes(c))) return false;
    // Result
    return true;
}

/**
 * Function for validating business phone
 * 
 * @param {String} businessPhone, value to verify
 * */
 const validateBusinessPhone = (businessPhone) => {
    // General checks
    if(!businessPhone) return false;
    if(businessPhone.length < 1) return false;
    if(businessPhone == "undefined") return false;
    // Check characters
    let characters = [...businessPhone.substring(0,businessPhone.length)];
    if(!characters.every(c => '0123456789 -+'.includes(c))) return false;
    // Result
    return true;
}

/**
 * Function for validating business website
 * 
 * @param {String} businessWebsite, value to verify
 * */
 const validateBusinessWebsite = (businessWebsite) => {
    // General checks
    if(!businessWebsite) return false;
    if(businessWebsite.length < 1) return false;
    if(businessWebsite == "undefined") return false;
    // Check characters
    let characters = [...businessWebsite.substring(0,businessWebsite.length)];
    if(!characters.every(c => '0123456789abcdefghijklmnopqrsštuvwxyzžåäö ,.-:/'.includes(c))) return false;
    // Result
    return true;
}

/**
 * Function for getting new verified businessName
 * 
 * @param {json} newdata, Raw json data from PRH
 * @param {json} savedata, Raw json data from PRH
 * @return {json} Only newest and verified data
 * */
 function getNewestBusinessName(newdata, savedata) {
    // Define variables
    let i=0, businessName = "", updateDate = savedata.updateDate;
    // Check and get the save
    if(validateBusinessName(savedata.businessName) == true) {
        businessName = savedata.businessName; 
    }
    // Go throught the new data
    while(typeof newdata.names[i] !=='undefined'){
        // Validate the new name
        if(validateBusinessName(newdata.names[i].name) == true && newdata.names[i].name != businessName) {
            // Check which one is newer
            if(newdata.names[i].registrationDate > updateDate || validateBusinessName(businessName) == false) {
                updateDate = newdata.names[i].registrationDate;
                businessName = newdata.names[i].name;
            }
        }
        i++;
    }
    // Return value
    if(validateBusinessName(businessName)) return businessName;
}

/**
 * Function for getting new verified businessAddress
 * 
 * @param {json} newdata, Raw json data from PRH
 * @param {json} savedata, Raw json data from PRH
 * @return {json} Only newest and verified data
 * */
 function getNewestBusinessAddress(newdata, savedata) {
    // Define variables
    let i=0, testAddress = "", businessAddress = "", updateDate = savedata.updateDate;
    // Check and get the save
    if(validateBusinessAddress(savedata.businessAddress) == true) {
        businessAddress = savedata.businessAddress; 
    }
    // Go throught the new data
    while(typeof newdata.addresses[i] !=='undefined'){
        // Validate the new address
        testAddress = newdata.addresses[i].street + ", " + newdata.addresses[i].postCode + " " + newdata.addresses[i].city;
        if(validateBusinessAddress(newdata.addresses[i].street) == true && validateBusinessAddress(newdata.addresses[i].postCode) == true && validateBusinessAddress(newdata.addresses[i].city) == true && testAddress != businessAddress) {
            // Check which one is newer
            if(newdata.addresses[i].registrationDate > updateDate || validateBusinessAddress(businessAddress) == false) {
                updateDate = newdata.addresses[i].registrationDate;
                businessAddress = testAddress;
            }
        }
        i++;
    }
    // Return value
    if(validateBusinessAddress(businessAddress)) return businessAddress;
}

/**
 * Function for getting new verified businessPhone
 * 
 * @param {json} newdata, Raw json data from PRH
 * @param {json} savedata, Raw json data from PRH
 * @return {json} Only newest and verified data
 * */
 function getNewestBusinessPhone(newdata, savedata) {
    // Define variables
    let i=0, businessPhone = "", updateDate = savedata.updateDate;
    // Check and get the save
    if(validateBusinessPhone(savedata.businessPhone) == true) {
        businessPhone = savedata.businessPhone; 
    }
    // Go throught the new data
    while(typeof newdata.contactDetails[i] !=='undefined'){
        // Validate the new name
        if(validateBusinessPhone(newdata.contactDetails[i].value) == true && newdata.contactDetails[i].value != businessPhone && (newdata.contactDetails[i].type == "Puhelin" || newdata.contactDetails[i].type == "Matkapuhelin")) {
            // Check which one is newer
            if(newdata.contactDetails[i].registrationDate > updateDate || validateBusinessPhone(businessPhone) == false) {
                updateDate = newdata.contactDetails[i].registrationDate;
                businessPhone = newdata.contactDetails[i].value;
            }
        }
        i++;
    }
    if(validateBusinessPhone(businessPhone)) return businessPhone;
}

/**
 * Function for getting new verified businessWebsite
 * 
 * @param {json} newdata, Raw json data from PRH
 * @param {json} savedata, Raw json data from PRH
 * @return {json} Only newest and verified data
 * */
function getNewestBusinessWebsite(newdata, savedata) {
    // Define variables
    let i=0, businessWebsite = "", updateDate = savedata.updateDate;   
    // Check and get the save
    if(validateBusinessWebsite(savedata.businessWebsite) == true) {
        businessWebsite = savedata.businessWebsite; 
    }
    // Go throught the new data
    while(typeof newdata.contactDetails[i] !=='undefined'){
        // Validate the new name
        if(validateBusinessWebsite(newdata.contactDetails[i].value) == true && newdata.contactDetails[i].value != businessWebsite && newdata.contactDetails[i].type == "Kotisivun www-osoite") {
            // Check which one is newer
            if(newdata.contactDetails[i].registrationDate > updateDate || validateBusinessWebsite(businessWebsite) == false) {
                updateDate = newdata.contactDetails[i].registrationDate;
                businessWebsite = newdata.contactDetails[i].value;
            }
        }
        i++;
    }
    // Return value
    if(validateBusinessWebsite(businessWebsite)) return businessWebsite;
}
