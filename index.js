let jakimData = null;
let latestSuggestion = "";

const zoneDropdown = document.getElementById('zoneDropdown');
const dayInput = document.getElementById('dayInput');
const fetchBtn = document.getElementById('fetchBtn');
const messageText = document.getElementById('messageText');
const scheduleBox = document.getElementById('scheduleBox');
const calcBox = document.getElementById('calcBox');
const calcBtn = document.getElementById('calcBtn');
const saveSuggestionBtn = document.getElementById('saveSuggestionBtn');

// event 1: set default day to today's day of the month when first open
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    dayInput.value = today.getDate();
});

// helper function: convert "06:01:00" into total minutes from midnight
function timeToMinutes(timeStr) {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    return (hours * 60) + minutes;
}

// helper function: convert total minutes back into "HH:MM"
function minutesToTime(totalMins) {
    if (totalMins < 0) {
        totalMins = totalMins + (24 * 60);
    }
    let hours = Math.floor(totalMins / 60);
    let mins = totalMins % 60;

    if (hours < 10) hours = '0' + hours;
    if (mins < 10) mins = '0' + mins;

    return hours + ':' + mins;
}

// event 2: fetch Prayer Times when user clicks Get Prayer Times
fetchBtn.addEventListener('click', () => {
    const zone = zoneDropdown.value;
    const day = parseInt(dayInput.value);

    // error scenario 1: Invalid Input Validation
    if (zone === "" || isNaN(day) || day < 1 || day > 31) {
        messageText.style.color = "red";
        messageText.textContent = "Invalid Input: Please select a JAKIM Zone from the list and enter a valid day (1 to 31)";
        scheduleBox.style.display = "none";
        calcBox.style.display = "none";
        return;
    }

    messageText.style.color = "blue";
    messageText.textContent = "Loading prayer times...";

    // fetch from Waktu Solat API (SOLAT V1 By Day)
    const apiUrl = `https://api.waktusolat.app/solat/${zone}/${day}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // error scenario 2: Empty Result (e.g. Day 31 on a 30-day month)
            if (!data || data.status !== "OK!" || !data.prayerTime) {
                messageText.style.color = "red";
                messageText.textContent = "No Results Found: No prayer data available for that day of the month.";
                scheduleBox.style.display = "none";
                calcBox.style.display = "none";
                return;
            }

            jakimData = data.prayerTime;

            // DOM Manipulation: Display retrieved JSON fields
            document.getElementById('displayZone').textContent = data.zone;
            document.getElementById('displayDate').textContent = jakimData.date;
            document.getElementById('displayDay').textContent = jakimData.day;
            document.getElementById('displayHijri').textContent = jakimData.hijri;

            document.getElementById('imsak').textContent = jakimData.imsak;
            document.getElementById('fajr').textContent = jakimData.fajr;
            document.getElementById('syuruk').textContent = jakimData.syuruk;
            document.getElementById('dhuha').textContent = jakimData.dhuha;
            document.getElementById('dhuhr').textContent = jakimData.dhuhr;
            document.getElementById('asr').textContent = jakimData.asr;
            document.getElementById('maghrib').textContent = jakimData.maghrib;
            document.getElementById('isha').textContent = jakimData.isha;

            // run suggestion logic
            checkActivitySuggestion(jakimData);

            messageText.style.color = "green";
            messageText.textContent = "Prayer times retrieved successfully";
            scheduleBox.style.display = "block";
            calcBox.style.display = "block";
        })
        .catch(error => {
            // error scenario 3: failed API request
            messageText.style.color = "red";
            messageText.textContent = "Failed API Request: Could not connect to server (" + error.message + ")";
            scheduleBox.style.display = "none";
            calcBox.style.display = "none";
        });
});

// suggestion logic using if...else comparing current time & prayer times
function checkActivitySuggestion(pt) {
    const now = new Date();
    const currentMins = (now.getHours() * 60) + now.getMinutes();
    document.getElementById('currentTimeText').textContent = minutesToTime(currentMins);

    const imsakMins = timeToMinutes(pt.imsak);
    const fajrMins = timeToMinutes(pt.fajr);
    const syurukMins = timeToMinutes(pt.syuruk);
    const dhuhaMins = timeToMinutes(pt.dhuha);
    const dhuhrMins = timeToMinutes(pt.dhuhr);
    const asrMins = timeToMinutes(pt.asr);
    const maghribMins = timeToMinutes(pt.maghrib);
    const ishaMins = timeToMinutes(pt.isha);

    const suggestionText = document.getElementById('suggestionText');

    if (currentMins >= imsakMins && currentMins < fajrMins) {
        latestSuggestion = "Imsak Window: Finish Sahur if fasting and prepare for Subuh prayer";
    } else if (currentMins >= fajrMins && currentMins < syurukMins) {
        latestSuggestion = "Subuh Window: Perform Subuh prayer and recite morning Al-Mathurat";
    } else if (currentMins >= syurukMins && currentMins < dhuhaMins) {
        latestSuggestion = "Syuruk Window: Forbidden time for Sunat prayer! Good time for Quran reading or Zikir";
    } else if (currentMins >= dhuhaMins && currentMins < dhuhrMins) {
        latestSuggestion = "Dhuha Window: Perform Solat Sunat Dhuha before Zohor begins";
    } else if (currentMins >= dhuhrMins && currentMins < asrMins) {
        latestSuggestion = "Zohor Window: Perform Zohor prayer and Solat sunat Rawatib";
    } else if (currentMins >= asrMins && currentMins < maghribMins) {
        latestSuggestion = "Asar Window: Perform Asar prayer and evening Zikir";
    } else if (currentMins >= maghribMins && currentMins < ishaMins) {
        latestSuggestion = "Maghrib Window: Perform Maghrib prayer and recite Surah Al-Waqiah / Al-Mulk";
    } else if (currentMins >= ishaMins || currentMins < imsakMins) {
        latestSuggestion = "Isyak & Night Window: Perform Isyak prayer, Sunat Witr, or Tahajjud before Imsak";
    } else {
        latestSuggestion = "General Activity: Recite daily Istighfar and Selawat";
    }

    suggestionText.textContent = latestSuggestion;
}

// event 3: meaningful calculation (prep time + how many hours fasting)
calcBtn.addEventListener('click', () => {
    const selectedKey = document.getElementById('prayerSelect').value;
    const prepMinutes = parseInt(document.getElementById('prepInput').value);
    const calcOutput = document.getElementById('calcOutput');

    if (!jakimData) {
        calcOutput.style.color = "red";
        calcOutput.textContent = "Please retrieve JAKIM prayer times first.";
        return;
    }

    if (isNaN(prepMinutes) || prepMinutes < 1 || prepMinutes > 120) {
        calcOutput.style.color = "red";
        calcOutput.textContent = "Invalid Input: Please enter preparation minutes between 1 and 120.";
        return;
    }

    const selectedPrayerTime = jakimData[selectedKey];
    const prayerMins = timeToMinutes(selectedPrayerTime);
    const prepStartTime = minutesToTime(prayerMins - prepMinutes);

    const fajrMins = timeToMinutes(jakimData.fajr);
    const maghribMins = timeToMinutes(jakimData.maghrib);
    const totalFastMins = maghribMins - fajrMins;
    const fastHours = Math.floor(totalFastMins / 60);
    const fastRemMins = totalFastMins % 60;

    calcOutput.style.color = "#004d40";
    calcOutput.textContent = `Preparation Time: Start getting ready at ${prepStartTime} (${prepMinutes} mins before ${selectedPrayerTime}). | Total Fasting Duration (Subuh to Maghrib): ${fastHours} hours ${fastRemMins} minutes.`;
});

// event 4: save suggestion into local storage
saveSuggestionBtn.addEventListener('click', () => {
    if (!latestSuggestion) {
        return;
    }

    let items = JSON.parse(localStorage.getItem('solatReminders')) || [];
    items.push("[Suggested] " + latestSuggestion);
    localStorage.setItem('solatReminders', JSON.stringify(items));

    messageText.style.color = "green";
    messageText.textContent = "Saved suggestion to Local Storage! Click '2. Activity Reminders' to view it.";
});