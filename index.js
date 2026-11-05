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

// event 1: set default day
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    dayInput.value = today.getDate();
});

function timeToMinutes(timeStr) {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    return (hours * 60) + minutes;
}

function minutesToTime(totalMins) {
    if (totalMins < 0) {
        totalMins = totalMins + (24 * 60);
    }
    let hours = Math.floor(totalMins / 60);
    let mins = Math.floor(totalMins % 60);

    if (hours < 10) hours = '0' + hours;
    if (mins < 10) mins = '0' + mins;

    return hours + ':' + mins;
}

// event 2: fetch Prayer Times
fetchBtn.addEventListener('click', () => {
    const zone = zoneDropdown.value;
    const day = parseInt(dayInput.value);

    if (zone === "" || isNaN(day) || day < 1 || day > 31) {
        messageText.style.color = "red";
        messageText.textContent = "Invalid Input: Please select a JAKIM Zone from the list and enter a valid day (1 to 31)";
        scheduleBox.style.display = "none";
        calcBox.style.display = "none";
        return;
    }

    messageText.style.color = "blue";
    messageText.textContent = "Loading prayer times...";

    const apiUrl = `https://api.waktusolat.app/solat/${zone}/${day}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (!data || data.status !== "OK!" || !data.prayerTime) {
                messageText.style.color = "red";
                messageText.textContent = "No Results Found: No prayer data available for that day of the month.";
                scheduleBox.style.display = "none";
                calcBox.style.display = "none";
                return;
            }

            jakimData = data.prayerTime;

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

            checkActivitySuggestion(jakimData);

            messageText.style.color = "green";
            messageText.textContent = "Prayer times retrieved successfully";
            scheduleBox.style.display = "block";
            calcBox.style.display = "block";
        })
        .catch(error => {
            messageText.style.color = "red";
            messageText.textContent = "Failed API Request: Could not connect to server (" + error.message + ")";
            scheduleBox.style.display = "none";
            calcBox.style.display = "none";
        });
});

// suggestion logic
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

// event 3: Meaningful Calculation (Last 1/3 of the Night for Tahajjud)
calcBtn.addEventListener('click', () => {
    const prepMinutes = parseInt(document.getElementById('prepInput').value);
    const calcOutput = document.getElementById('calcOutput');

    if (!jakimData) {
        calcOutput.style.color = "red";
        calcOutput.textContent = "Please retrieve JAKIM prayer times first.";
        return;
    }

    if (isNaN(prepMinutes) || prepMinutes < 0 || prepMinutes > 120) {
        calcOutput.style.color = "red";
        calcOutput.textContent = "Invalid Input: Please enter preparation minutes between 0 and 120.";
        return;
    }

    // Mathematical Calculation: Maghrib to Fajr duration divided by 3
    const maghribMins = timeToMinutes(jakimData.maghrib);
    const fajrMins = timeToMinutes(jakimData.fajr);

    // Total night duration across midnight (e.g. 19:30 to 06:00)
    const nightDuration = ((24 * 60) - maghribMins) + fajrMins;
    const oneThirdNight = nightDuration / 3;

    // Start of the last third = Fajr minus one third
    let lastThirdStartMins = fajrMins - oneThirdNight;
    if (lastThirdStartMins < 0) {
        lastThirdStartMins += (24 * 60); // handle if it falls before midnight
    }

    // Wake Up Time = Add user's prep time to the exact start
    let wakeUpTime = lastThirdStartMins + prepMinutes;
    if (wakeUpTime >= fajrMins) {
        wakeUpTime = fajrMins - 15; // Prevent waking up after Subuh
    }

    calcOutput.style.color = "#004d40";
    calcOutput.textContent = `Result: The optimal Last 1/3 of the Night begins exactly at ${minutesToTime(lastThirdStartMins)}. With ${prepMinutes} minutes of preparation, your ideal wake-up time is ${minutesToTime(wakeUpTime)}.`;
});

// event 4: save suggestion into local storage with INLINE notification
saveSuggestionBtn.addEventListener('click', () => {
    if (!latestSuggestion) return;

    let items = JSON.parse(localStorage.getItem('solatReminders')) || [];
    items.push("[Suggested] " + latestSuggestion);
    localStorage.setItem('solatReminders', JSON.stringify(items));

    // Show feedback right next to the button instead of the top message
    const suggestionFeedback = document.getElementById('suggestionFeedback');
    suggestionFeedback.textContent = "✓ Saved to Reminders!";
    
    // Automatically clear the message after 3 seconds
    setTimeout(() => {
        suggestionFeedback.textContent = "";
    }, 3000);
});