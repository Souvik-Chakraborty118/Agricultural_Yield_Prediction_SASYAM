const state = {
  options: null,
  latestReport: null,
  latestInput: null,
  lang: "en",
  isLoggedIn: false,
  userProfile: null,
  sasyamId: null
};

//SASYAM ID Functions
function showSasyamIDCreation() {
  const modal = document.getElementById("sasyamIDSignupModal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeSasyamIDModal() {
  const modal = document.getElementById("sasyamIDSignupModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function backToLogin() {
  showPage("login");
}

function togglePasswordVisibility(fieldId, button) {
  const field = document.getElementById(fieldId);
  if (field.type === "password") {
    field.type = "text";
    button.textContent = "Hide";
  } else {
    field.type = "password";
    button.textContent = "Show";
  }
}

function createSasyamID(event) {
  event.preventDefault();
  
  const email = document.getElementById("sasyamEmail").value;
  const password = document.getElementById("sasyamPassword").value;
  const passwordConfirm = document.getElementById("sasyamPasswordConfirm").value;
  const phone = document.getElementById("sasyamPhone").value;
  const name = document.getElementById("sasyamName").value;
  const location = document.getElementById("sasyamLocation").value;
  const farmSize = parseFloat(document.getElementById("sasyamFarmSize").value);
  const experience = parseInt(document.getElementById("sasyamExperience").value);
  const crop = document.getElementById("sasyamCrop").value;
  const termsCheckbox = document.getElementById("sasyamTerms");
  
  // Validate passwords match
  if (password !== passwordConfirm) {
    alert("Passwords do not match!");
    return;
  }
  
  // Validate terms are accepted
  if (!termsCheckbox.checked) {
    alert("Please agree to the Terms and Conditions");
    return;
  }
  
  // Validate phone
  if (phone.length !== 10 || isNaN(phone)) {
    alert("Please enter a valid 10-digit mobile number");
    return;
  }
  
  //Create SASYAM profile
  state.userProfile = {
    name: name,
    email: email,
    phone: phone,
    farmLocation: location,
    farmSize: farmSize,
    experience: experience,
    primaryCrop: crop,
    createdAt: new Date().toISOString(),
    sasyamId: 'SASYAM_' + Date.now().toString(36).toUpperCase()
  };
  
  state.sasyamId = state.userProfile.sasyamId;
  state.isLoggedIn = true;
  
  // Save to localStorage
  localStorage.setItem('sasyam_user_' + email, JSON.stringify(state.userProfile));
  localStorage.setItem('sasyam_session', state.sasyamId);
  
  // Close modal
  closeSasyamIDModal();
  
  // Show entrance page
  showPage("entrance");
  updateUIAfterLogin();
}

function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const storedUserData = localStorage.getItem('sasyam_user_' + email);
  if (!storedUserData) {
    alert("No account found with this email. Please create a SASYAM ID.");
    return;
  }

  const userProfile = JSON.parse(storedUserData);
  state.userProfile = userProfile;
  state.sasyamId = userProfile.sasyamId;
  state.isLoggedIn = true;

  localStorage.setItem('sasyam_session', state.sasyamId);
  updateUIAfterLogin();
  showPage("entrance");
}

function showProfilePage() {
  if (!state.userProfile) {
    showPage("login");
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'profile-modal glass-effect-modal active';
  modal.innerHTML = `
    <div class="profile-modal-content glass-effect-panel">
      <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
      <h2>${t('profile')}</h2>
      
      <div class="profile-card">
        <div class="profile-info">
          <p><strong>SASYAM ID:</strong> ${state.userProfile.sasyamId}</p>
          <p><strong>Created:</strong> ${new Date(state.userProfile.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div class="edit-profile-section">
          <h3>Edit Profile</h3>
          <div class="form-group">
            <label>Name:</label>
            <input type="text" id="editName" value="${state.userProfile.name || ''}" placeholder="Full Name">
          </div>
          
          <div class="form-group">
            <label>Email:</label>
            <input type="email" id="editEmail" value="${state.userProfile.email || ''}" placeholder="Email Address" readonly style="background: #f5f5f5; cursor: not-allowed;">
          </div>
          
          <div class="form-group">
            <label>Age:</label>
            <input type="number" id="editAge" value="${state.userProfile.age || ''}" placeholder="Age" min="1" max="150">
          </div>
          
          <div class="form-group">
            <label>Mobile Number:</label>
            <input type="tel" id="editPhone" value="${state.userProfile.phone || ''}" placeholder="10-digit mobile number" pattern="[0-9]{10}">
          </div>
          
          <div class="form-group">
            <label>Farm Location:</label>
            <input type="text" id="editFarmLocation" value="${state.userProfile.farmLocation || ''}" placeholder="City/District" readonly style="background: #f5f5f5; cursor: not-allowed;">
          </div>
          
          <div class="profile-actions">
            <button class="primary-action" onclick="saveProfileChanges(this)">Save Changes</button>
            <button class="secondary-action" onclick="this.closest('.profile-modal').remove()">Close</button>
          </div>
        </div>
      </div>
      
      <button class="secondary-action" onclick="logoutUser()" style="width: 100%; margin-top: 12px;">${t('logout')}</button>
    </div>
  `;
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-overlay';
  backdrop.onclick = () => modal.remove();
  modal.appendChild(backdrop);
  
  document.body.appendChild(modal);
}

function logoutUser() {
  state.isLoggedIn = false;
  state.userProfile = null;
  state.sasyamId = null;
  localStorage.removeItem('sasyam_session');
  showPage("login");
  updateUIAfterLogin();
  // Close any open modals
  document.querySelectorAll('.profile-modal').forEach(m => m.remove());
}

function saveProfileChanges(btn) {
  const editName = document.getElementById('editName').value;
  const editAge = document.getElementById('editAge').value;
  const editPhone = document.getElementById('editPhone').value;
  
  // Validate phone
  if (editPhone && editPhone.length !== 10) {
    alert('Phone number must be 10 digits');
    return;
  }
  
  // Update profile
  state.userProfile.name = editName || state.userProfile.name;
  state.userProfile.age = editAge ? parseInt(editAge) : state.userProfile.age;
  state.userProfile.phone = editPhone || state.userProfile.phone;
  
  // Save to localStorage
  localStorage.setItem('sasyam_user_' + state.userProfile.email, JSON.stringify(state.userProfile));
  
  alert('Profile updated successfully!');
  btn.closest('.profile-modal').remove();
  
  // Show updated profile
  showProfilePage();
}

function updateUIAfterLogin() {
  const mainNav = document.getElementById('mainNavigation');
  const authOnly = document.querySelectorAll('.auth-only');
  const profileOnly = document.querySelectorAll('.profile-only');
  
  if (state.isLoggedIn) {
    mainNav?.classList.remove('hidden');
    authOnly.forEach(el => el.classList.remove('hidden'));
    profileOnly.forEach(el => el.classList.remove('hidden'));
  } else {
    mainNav?.classList.add('hidden');
    authOnly.forEach(el => el.classList.add('hidden'));
    profileOnly.forEach(el => el.classList.add('hidden'));
  }
}

// Check if user is already logged in on page load
window.addEventListener('DOMContentLoaded', function() {
  const sessionId = localStorage.getItem('sasyam_session');
  if (sessionId) {
    state.sasyamId = sessionId;
    // Try to find user profile
    for (let key in localStorage) {
      if (key.startsWith('sasyam_user_')) {
        try {
          state.userProfile = JSON.parse(localStorage.getItem(key));
          state.isLoggedIn = true;
          break;
        } catch (e) {
          //skip
        }
      }
    }
  }
  updateUIAfterLogin();
  applyLanguage();
  loadOptions().catch(error => {
    console.warn('Failed to load options:', error);
  });
});

function logout() {
  state.isLoggedIn = false;
  state.userProfile = null;
  state.googleUser = null;
  showPage("login");
}


const i18n = {
  en: {
    brandSub: "Analytical Engine", home: "Home", calculator: "Calculator", profile: "Profile",
    eyebrow: "Precision agriculture intelligence", developedBy: "Developed by",
    support: "Certified and verified by partner institutions and government-backed initiatives.",
    openCalculator: "Open Yield Calculator", certified: "Certified and Verified By",
    farmParams: "Farm parameters", state: "State", crop: "Crop", variety: "Variety",
    season: "Season", year: "Target Year", area: "Area (Hectares)",
    seed: "Seed Rate (kg/ha)", fertilizer: "Fertilizer (kg/ha)",
    pesticide: "Pesticide (kg/ha)", rainfall: "Annual Rainfall Range (mm)",
    temperature: "Actual Temp (C)", cost: "Production Cost (per ha)",
    costHelp: "Turn on actual cost below to use this value.",
    climate: "Climate Stress Index", soil: "Soil Nutrient Index",
    useCost: "Use my actual costs", submit: "Generate Precision Report",
    totalYield: "Total Predicted Yield", qtlHa: "Quintals Per Hectare",
    msp: "Est. Market Price", revenue: "Total Revenue", profit: "Net Profit",
    status: "Performance Status", statusNote: "Enter farm parameters to generate a report.",
    chatTitle: "Chat with Results", chatWelcome: "SASYAM Intelligence Core Active. Generate a report and ask me anything about yield, profit, fertilizer, or risk.",
    chatPlaceholder: "Ask about profit...", ask: "Ask", sync: "Synchronizing...",
    downloadPdf: "Download PDF Report",
    reportTitle: "Precision Report Explanation",
    reportDescription: "Transparent report output with yield, profit, ROI, and explainable AI reasoning.",
    yieldLabel: "Yield",
    profitLabel: "Profit",
    roiLabel: "ROI",
    xaiTitle: "160-Tier XAI",
    xaiTierLabel: "XAI Tier",
    useCurrentWeather: "Use Current Weather",
    // SASYAM ID Signup
    createAccount: "Create Account", signupTitle: "Create SASYAM ID", email: "Email", password: "Password",
    passwordConfirm: "Confirm Password", phone: "Phone Number", name: "Full Name", farmLocation: "Farm Location",
    farmSize: "Farm Size (hectares)", experience: "Farming Experience (years)", primaryCrop: "Primary Crop",
    createSasyamID: "Create SASYAM ID", backToLogin: "Back to Login", show: "Show", hide: "Hide",
    logout: "Logout", editProfile: "Edit Profile", farmName: "Farm Name", createProfile: "Create Your Profile",
    district: "District", rainfallRecommendation: "Recommended rainfall shown for guidance.", rainfallRecommendationSeason: "Recommended {season} rainfall in {state}:",
    blackSwanTitle: "Black Swan What If Simulator", blackSwanDescription: "Estimate potential loss from extreme heatwave, drought, flood or cyclone events.",
    heatwave: "Heatwave", drought: "Drought", flood: "Flood", cyclone: "Cyclone", severity: "Severity (%)",
    calculateLoss: "Calculate Loss", lossEstimate: "Estimated loss", noReportLoss: "Run the precision report first for a more accurate estimate.",
    selectEvent: "Select at least one extreme event.", lossSuffix: "of output under selected extreme events.",
    lossProfitPhrase: "Profit reduction", lossYieldPhrase: "Yield drop", entranceTitle: "SASYAM Portal",
    welcome: "Welcome", selectLanguage: "Select Language"
  },
  hi: {
    brandSub: "विश्लेषण इंजन", home: "होम", calculator: "कैलकुलेटर", profile: "प्रोफाइल",
    eyebrow: "सटीक कृषि बुद्धिमत्ता", developedBy: "डेवलपर",
    support: "साझेदार संस्थानों और सरकारी पहलों द्वारा प्रमाणित और सत्यापित।",
    openCalculator: "उपज कैलकुलेटर खोलें", certified: "प्रमाणित और सत्यापित द्वारा",
    farmParams: "खेत पैरामीटर", state: "राज्य", crop: "फसल", variety: "किस्म",
    season: "मौसम", year: "लक्ष्य वर्ष", area: "क्षेत्र (हेक्टेयर)",
    seed: "बीज दर (kg/ha)", fertilizer: "उर्वरक (kg/ha)",
    pesticide: "कीटनाशक (kg/ha)", rainfall: "वार्षिक वर्षा (mm)",
    temperature: "वास्तविक तापमान (C)", cost: "उत्पादन लागत (प्रति ha)",
    costHelp: "इस मान का उपयोग करने के लिए नीचे वास्तविक लागत चालू करें।",
    climate: "जलवायु तनाव सूचकांक", soil: "मृदा पोषक सूचकांक",
    useCost: "मेरी वास्तविक लागत का उपयोग करें", submit: "प्रिसिजन रिपोर्ट बनाएं",
    totalYield: "कुल अनुमानित उपज", qtlHa: "क्विंटल प्रति हेक्टेयर",
    msp: "बाजार मूल्य (MSP)", revenue: "कुल राजस्व", profit: "शुद्ध लाभ",
    status: "प्रदर्शन स्थिति", statusNote: "रिपोर्ट बनाने के लिए खेत पैरामीटर दर्ज करें।",
    chatTitle: "रिजल्ट से चैट करें", chatWelcome: "SASYAM इंटेलिजेंस कोर सक्रिय है। रिपोर्ट बनाएं और उपज, लाभ, खाद या जोखिम पर पूछें।",
    chatPlaceholder: "लाभ के बारे में पूछें...", ask: "पूछें", sync: "सिंक हो रहा है...",
    downloadPdf: "पीडीएफ रिपोर्ट डाउनलोड करें",
    reportTitle: "प्रिसिजन रिपोर्ट स्पष्टीकरण",
    reportDescription: "उपज, लाभ, ROI और समझने योग्य AI तर्क के साथ पारदर्शी रिपोर्ट आउटपुट।",
    yieldLabel: "उपज",
    profitLabel: "लाभ",
    roiLabel: "ROI",
    xaiTitle: "160-स्तर XAI",
    xaiTierLabel: "XAI स्तर",
    useCurrentWeather: "वर्तमान मौसम उपयोग करें",
    // SASYAM ID Signup
    createAccount: "खाता बनाएं", signupTitle: "SASYAM ID बनाएं", email: "ईमेल", password: "पासवर्ड",
    passwordConfirm: "पासवर्ड की पुष्टि करें", phone: "फोन नंबर", name: "पूरा नाम", farmLocation: "खेत का स्थान",
    farmSize: "खेत का आकार (हेक्टेयर)", experience: "खेती का अनुभव (वर्ष)", primaryCrop: "प्राथमिक फसल",
    createSasyamID: "SASYAM ID बनाएं", backToLogin: "लॉगिन पर वापस जाएं", show: "दिखाएं", hide: "छुपाएं",
    logout: "लॉगआउट", editProfile: "प्रोफाइल संपादित करें", farmName: "खेत का नाम", createProfile: "अपनी प्रोफाइल बनाएं",
    district: "जिला", rainfallRecommendation: "अनुशंसित वर्षा मार्गदर्शन के लिए दिखाएँ।", rainfallRecommendationSeason: "{state} में अनुशंसित {season} वर्षा:",
    blackSwanTitle: "ब्लैक स्वान What If सिम्युलेटर", blackSwanDescription: "अत्यधिक हीटवेव, सूखा, बाढ़ या चक्रवात से संभावित नुकसान का अनुमान लगाएँ।",
    heatwave: "हीटवेव", drought: "सूखा", flood: "बाढ़", cyclone: "चक्रवात", severity: "गंभीरता (%)",
    calculateLoss: "नुकसान गणना करें", lossEstimate: "अनुमानित नुकसान", noReportLoss: "अधिक सटीक अनुमान के लिए पहले प्रिसिजन रिपोर्ट बनाएं।",
    selectEvent: "कृपया कम से कम एक अत्यधिक घटना चुनें।", lossSuffix: "चयनित घटनाओं के तहत आउटपुट का",
    lossProfitPhrase: "लाभ में कमी", lossYieldPhrase: "उपज में गिरावट",
    entranceTitle: "SASYAM पोर्टल", welcome: "स्वागत है", selectLanguage: "भाषा चुनें"
  },
  bn: {
    brandSub: "বিশ্লেষণ ইঞ্জিন", home: "হোম", calculator: "ক্যালকুলেটর",
    eyebrow: "নির্ভুল কৃষি বুদ্ধিমত্তা", developedBy: "ডেভেলপার",
    support: "সহযোগী প্রতিষ্ঠান ও সরকারি উদ্যোগ দ্বারা প্রত্যয়িত এবং যাচাইকৃত।",
    openCalculator: "ফলন ক্যালকুলেটর খুলুন", certified: "প্রত্যয়িত ও যাচাইকৃত",
    farmParams: "খামার প্যারামিটার", state: "রাজ্য", crop: "ফসল", variety: "জাত",
    season: "মৌসুম", year: "লক্ষ্য বছর", area: "এলাকা (হেক্টর)",
    seed: "বীজ হার (kg/ha)", fertilizer: "সার (kg/ha)",
    pesticide: "কীটনাশক (kg/ha)", rainfall: "বার্ষিক বৃষ্টি (mm)",
    temperature: "তাপমাত্রা (C)", cost: "উৎপাদন খরচ (প্রতি ha)",
    costHelp: "এই মান ব্যবহার করতে নিচে বাস্তব খরচ চালু করুন।",
    climate: "জলবায়ু চাপ সূচক", soil: "মাটি পুষ্টি সূচক",
    useCost: "আমার বাস্তব খরচ ব্যবহার করুন", submit: "প্রিসিশন রিপোর্ট তৈরি করুন",
    totalYield: "মোট পূর্বাভাসিত ফলন", qtlHa: "কুইন্টাল প্রতি হেক্টর",
    msp: "বাজার মূল্য (MSP)", revenue: "মোট রাজস্ব", profit: "নিট লাভ",
    status: "পারফরম্যান্স অবস্থা", statusNote: "রিপোর্ট তৈরি করতে খামার প্যারামিটার দিন।",
    chatTitle: "রেজাল্ট নিয়ে চ্যাট", chatWelcome: "SASYAM ইন্টেলিজেন্স কোর সক্রিয়। রিপোর্ট তৈরি করে ফলন, লাভ, সার বা ঝুঁকি নিয়ে প্রশ্ন করুন।",
    chatPlaceholder: "লাভ সম্পর্কে জিজ্ঞাসা করুন...", ask: "জিজ্ঞাসা", sync: "সিঙ্ক হচ্ছে...",
    reportTitle: "স্পষ্ট রিপোর্ট ব্যাখ্যা",
    reportDescription: "উৎপাদন, লাভ, ROI এবং বোধগম্য AI যুক্তি সহ স্বচ্ছ রিপোর্ট আউটপুট।",
    yieldLabel: "উৎপাদন",
    profitLabel: "লাভ",
    roiLabel: "ROI",
    xaiTitle: "160-স্তরের XAI",
    xaiTierLabel: "XAI স্তর",
    useCurrentWeather: "বর্তমান আবহাওয়া ব্যবহার করুন",
    district: "জেলা", rainfallRecommendation: "রেকমেন্ডেড বৃষ্টি নির্দেশিকা হিসেবে দেখানো হচ্ছে।", rainfallRecommendationSeason: "{state}-এ প্রস্তাবিত {season} বৃষ্টিপাত:",
    blackSwanTitle: "ব্ল্যাক সুয়ান What If সিমুলেটর", blackSwanDescription: "তীব্র তাপপ্রবাহ, খরা, বন্যা বা ঘূর্ণিঝড়ে সম্ভাব্য ক্ষতি অনুমান করুন।",
    heatwave: "তাপপ্রবাহ", drought: "খরা", flood: "বন্যা", cyclone: "ঘূর্ণিঝড়", severity: "তীব্রতা (%)",
    calculateLoss: "ক্ষতি গণনা করুন", lossEstimate: "অনুমানিত ক্ষতি", noReportLoss: "আরো সঠিক অনুমানের জন্য আগে প্রিসিশন রিপোর্ট তৈরি করুন।",
    selectEvent: "কমপক্ষে একটি চরম ঘটনা নির্বাচন করুন।", lossSuffix: "নির্বাচিত ঘটনাগুলির অধীনে আউটপুট।",
    lossProfitPhrase: "লাভ হ্রাস", lossYieldPhrase: "ফসল হ্রাস"
  },
  te: {
    brandSub: "విశ్లేషణ ఇంజిన్", home: "హోమ్", calculator: "క్యాల్క్యులేటర్",
    eyebrow: "ఖచ్చితమైన వ్యవసాయ మేధస్సు", developedBy: "డెవలపర్",
    support: "భాగస్వామ్య సంస్థలు మరియు ప్రభుత్వ కార్యక్రమాల ద్వారా ధృవీకరించబడింది.",
    openCalculator: "దిగుబడి క్యాల్క్యులేటర్ తెరువు", certified: "ధృవీకరించిన సంస్థలు",
    farmParams: "ఫార్మ్ పారామీటర్లు", state: "రాష్ట్రం", crop: "పంట", variety: "రకం",
    season: "సీజన్", year: "లక్ష్య సంవత్సరం", area: "విస్తీర్ణం (హెక్టార్లు)",
    seed: "విత్తన రేటు (kg/ha)", fertilizer: "ఎరువు (kg/ha)",
    pesticide: "పురుగుమందు (kg/ha)", rainfall: "వార్షిక వర్షపాతం (mm)",
    temperature: "ఉష్ణోగ్రత (C)", cost: "ఉత్పత్తి ఖర్చు (haకు)",
    costHelp: "ఈ విలువను ఉపయోగించడానికి కింద actual cost ఆన్ చేయండి.",
    climate: "వాతావరణ ఒత్తిడి సూచిక", soil: "మట్టి పోషక సూచిక",
    useCost: "నా నిజమైన ఖర్చులను వాడండి", submit: "ప్రిసిషన్ రిపోర్ట్ రూపొందించండి",
    totalYield: "మొత్తం అంచనా దిగుబడి", qtlHa: "హెక్టారుకు క్వింటాళ్లు",
    msp: "మార్కెట్ ధర (MSP)", revenue: "মোট ఆదాయం", profit: "నికర లాభం",
    status: "పనితీరు స్థితి", statusNote: "రిపోర్ట్ కోసం ఫార్మ్ పారామీటర్లు ఇవ్వండి.",
    chatTitle: "ఫలితాలతో చాట్", chatWelcome: "SASYAM ఇంటెలిజెన్స్ కోర్ యాక్టివ్. రిపోర్ట్ రూపొందించి దిగుబడి, లాభం, ఎరువు లేదా ప్రమాదం గురించి అడగండి.",
    chatPlaceholder: "లాభం గురించి అడగండి...", ask: "అడగండి", sync: "సింక్ అవుతోంది...",
    reportTitle: "ప్రిసిషన్ రిపోర్ట్ వివరణ",
    reportDescription: "పంట, లాభం, ROI మరియు వివరించుకోగల AI తర్కంతో పారదర్శక రిపోర్ట్ ఔట్‌పుట్.",
    yieldLabel: "పడుచు",
    profitLabel: "లాభం",
    roiLabel: "ROI",
    xaiTitle: "160-కట్టు XAI",
    xaiTierLabel: "XAI స్థాయి",
    useCurrentWeather: "ప్రస్తుత వాతావరణం ఉపయోగించండి",
    district: "జిల్లా", rainfallRecommendation: "సిఫార్సు చేసిన వర్షపాతం మార్గదర్శకంగా చూపబడుతుంది.", rainfallRecommendationSeason: "{state} వద్ద సిఫార్సు చేసిన {season} వర్షపాతం:",
    blackSwanTitle: "బ్లాక్ స్వాన్ What If సిమ్యులేటర్", blackSwanDescription: "వేడి అలలు, వంగున్న నీటి కొరత, వరద లేదా చక్రవాతంతో సంభవించే నష్టాన్ని అంచనా వేయండి.",
    heatwave: "హీట్‌వేవ్", drought: "ఖరద", flood: "వరద", cyclone: "చక్రవాతం", severity: "తీవ్రత (%)",
    calculateLoss: "నష్టం లెక్కించు", lossEstimate: "అంచనా నష్టం", noReportLoss: "మరింత ఖచ్చితమైన అంచనాకు ముందు ప్రిసిషన్ రిపోర్ట్ తయారు చేయండి.",
    selectEvent: "కనీసం ఒక తీవ్రమైన సంఘటనను ఎంచుకోండి.", lossSuffix: "ఎంచుకున్న సంఘటనల కింద అవుట్‌పుట్.",
    lossProfitPhrase: "లాభ తగ్గింపు", lossYieldPhrase: "పంట తగ్గింపు"
  },
  ta: {
    brandSub: "பகுப்பாய்வு இயந்திரம்", home: "முகப்பு", calculator: "கணிப்பான்",
    eyebrow: "துல்லிய வேளாண் நுண்ணறிவு", developedBy: "உருவாக்கியவர்",
    support: "கூட்டு நிறுவனங்கள் மற்றும் அரசு முயற்சிகளால் சான்றளிக்கப்பட்டது.",
    openCalculator: "மகசூல் கணிப்பான் திற", certified: "சான்றளித்த மற்றும் சரிபார்த்தவை",
    farmParams: "பண்ணை அளவுருக்கள்", state: "மாநிலம்", crop: "பயிர்", variety: "வகை",
    season: "பருவம்", year: "இலக்கு ஆண்டு", area: "பரப்பு (ஹெக்டேர்)",
    seed: "விதை வீதம் (kg/ha)", fertilizer: "உரம் (kg/ha)",
    pesticide: "பூச்சிக்கொல்லி (kg/ha)", rainfall: "வருடாந்திர மழை (mm)",
    temperature: "வெப்பநிலை (C)", cost: "உற்பத்தி செலவு (haக்கு)",
    costHelp: "இந்த மதிப்பைப் பயன்படுத்த கீழே actual cost ஐ இயக்கவும்.",
    climate: "காலநிலை அழுத்த குறியீடு", soil: "மண் ஊட்டச்சத்து குறியீடு",
    useCost: "என் உண்மையான செலவை பயன்படுத்தவும்", submit: "பிரிசிஷன் அறிக்கை உருவாக்கு",
    totalYield: "மொத்த கணிக்கப்பட்ட மகசூல்", qtlHa: "ஹெக்டேருக்கு குவிண்டால்",
    msp: "சந்தை விலை (MSP)", revenue: "மொத்த வருவாய்", profit: "நிகர லாபம்",
    status: "செயல்திறன் நிலை", statusNote: "அறிக்கைக்கு பண்ணை அளவுருக்கள் கொடுங்கள்.",
    chatTitle: "முடிவுகளுடன் அரட்டை", chatWelcome: "SASYAM Intelligence Core செயலில் உள்ளது. அறிக்கை உருவாக்கி மகசூல், லாபம், உரம் அல்லது அபாயம் பற்றி கேளுங்கள்.",
    chatPlaceholder: "லாபம் பற்றி கேளுங்கள்...", ask: "கேள்", sync: "சிங்க் செய்கிறது...",
    reportTitle: "துல்லிய அறிக்கை விளக்கம்",
    reportDescription: "பயிர், லாபம், ROI மற்றும் விளக்கக்கூடிய AI காரணத்துடன் தெளிவான அறிக்கை வெளியீடு.",
    yieldLabel: "பயிர்",
    profitLabel: "லாபம்",
    roiLabel: "ROI",
    xaiTitle: "160-அடுக்கு XAI",
    xaiTierLabel: "XAI அடுக்கு",
    useCurrentWeather: "நிகழ்கால வானிலை பயன்படுத்தவும்",
    district: "மாவட்டம்", rainfallRecommendation: "பரிந்துரைக்கப்பட்ட மழை வழிகாட்டியாகக் காட்டப்படுகிறது.", rainfallRecommendationSeason: "{state} இல் பரிந்துரைக்கப்பட்ட {season} மழை:",
    blackSwanTitle: "பிளாக் ஸ்வான் What If சிமுலேட்டர்", blackSwanDescription: "கடுமையான வெப்ப அலை, வறடை, வெள்ளம் அல்லது சைக்கிளோன் தாக்கங்களை மதிக்கவும்.",
    heatwave: "ஹீட்வேవ్", drought: "வறடை", flood: "வெள்ளம்", cyclone: "சைக்கிளோன்", severity: "கடுமை (%)",
    calculateLoss: "நஷ்டத்தை கணக்கிடு", lossEstimate: "மதிப்பீட்டிய நஷ்டம்", noReportLoss: "மேலும் துல்லியமான மதிப்பீட்டுக்கு முதலில் பிரிசிஷன் நிபுணத்துவ அறிக்கையை உருவாக்கவும்.",
    selectEvent: "குறைந்தது ஒரு கடுமையான நிகழ்வைத் தேர்ந்தெடுக்கவும்.", lossSuffix: "தேர்ந்தெடுக்கப்பட்ட நிகழ்வுகளின் கீழ் வெளியீடு.",
    lossProfitPhrase: "இழப்பு பங்கு", lossYieldPhrase: "பயிர் இழப்பு"
  }
};

["mr", "gu", "kn", "ml", "pa"].forEach(lang => {
  i18n[lang] = { ...i18n.en };
});

i18n.ne = {
  ...i18n.en
};

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const optionTranslations = {
  hi: {
    Kharif: "खरीफ", Rabi: "रबी", Summer: "जायद", "Whole Year": "पूरे साल", Autumn: "शरद", Winter: "शीत",
    "Andhra Pradesh": "आंध्र प्रदेश", "Arunachal Pradesh": "अरुणाचल प्रदेश", Assam: "असम", Bihar: "बिहार", Chhattisgarh: "छत्तीसगढ़", Delhi: "दिल्ली", Goa: "गोवा", Gujarat: "गुजरात", Haryana: "हरियाणा", "Himachal Pradesh": "हिमाचल प्रदेश", "Jammu And Kashmir": "जम्मू और कश्मीर", Jharkhand: "झारखंड", Karnataka: "कर्नाटक", Kerala: "केरल", "Madhya Pradesh": "मध्य प्रदेश", Maharashtra: "महाराष्ट्र", Manipur: "मणिपुर", Meghalaya: "मेघालय", Mizoram: "मिजोरम", Nagaland: "नागालैंड", Odisha: "ओडिशा", Puducherry: "पुडुचेरी", Punjab: "पंजाब", Sikkim: "सिक्किम", "Tamil Nadu": "तमिलनाडु", Telangana: "तेलंगाना", Tripura: "त्रिपुरा", "Uttar Pradesh": "उत्तर प्रदेश", Uttarakhand: "उत्तराखंड", "West Bengal": "पश्चिम बंगाल",
    Wheat: "गेहूं", Rice: "चावल", Sugarcane: "गन्ना", Potato: "आलू", Maize: "मक्का", Banana: "केला", Onion: "प्याज", Groundnut: "मूंगफली", Soyabean: "सोयाबीन", Sunflower: "सूरजमुखी", Turmeric: "हल्दी", Coconut: "नारियल", Gram: "चना", Jute: "जूट", Tobacco: "तंबाकू", "Cotton(Lint)": "कपास", "Arhar/Tur": "अरहर/तुअर", Bajra: "बाजरा", Ragi: "रागी", Mustard: "सरसों",
    Arecanut: "सुपारी", Barley: "जौ", "Black Pepper": "काली मिर्च", Cardamom: "इलायची", Cashewnut: "काजू", "Castor Seed": "अरंडी", Coriander: "धनिया", "Cowpea(Lobia)": "लोबिया", "Dry Chillies": "सूखी मिर्च", Garlic: "लहसुन", Ginger: "अदरक", "Guar Seed": "ग्वार के बीज", "Horse-Gram": "कुलथी", Jowar: "ज्वार", Khesari: "खेसारी", Linseed: "अलसी", Masoor: "मसूर", Mesta: "मेस्ता", "Moong(Green Gram)": "मूंग", "Moth Beam": "मोठ", "Niger seed": "नाइजर के बीज", "Other Kharif Pulses": "अन्य खरीफ दालें", "Other Rabi Pulses": "अन्य रबी दालें", Paddy: "धान", "Peas & Beans (Pulses)": "मटर और बीन्स", "Rapeseed &Mustard": "सरसों और राई", Safflower: "कुसुम", Sannhamp: "सन्नी भांग", Sesamum: "तिल", "Small millets": "छोटी बाजरा", "Sweet potato": "शकरकंद", Tapioca: "सागूदाना", Urad: "उड़द"
  },
  bn: {
    Kharif: "খরিফ", Rabi: "রবি", Summer: "গ্রীষ্ম", "Whole Year": "সারা বছর", Autumn: "শরৎ", Winter: "শীত",
    "Andhra Pradesh": "অন্ধ্র প্রদেশ", "Arunachal Pradesh": "অরুণাচল প্রদেশ", Assam: "আসাম", Bihar: "বিহার", Chhattisgarh: "ছত্তীসগড়", Delhi: "দিল্লি", Goa: "গোয়া", Gujarat: "গুজরাট", Haryana: "হরিয়ানা", "Himachal Pradesh": "হিমাচল প্রদেশ", "Jammu And Kashmir": "জম্মু ও কাশ্মীর", Jharkhand: "ঝাড়খণ্ড", Karnataka: "কর্ণাটক", Kerala: "কেরালা", "Madhya Pradesh": "মধ্য প্রদেশ", Maharashtra: "মহারাষ্ট্র", Manipur: "মণিপুর", Meghalaya: "মেঘালয়", Mizoram: "মিজোরাম", Nagaland: "নাগাল্যান্ড", Odisha: "ওডিশা", Puducherry: "পুদুচেরি", Punjab: "পাঞ্জাব", Sikkim: "সিকিম", "Tamil Nadu": "তামিলনাড়ু", Telangana: "তেলেঙ্গানা", Tripura: "ত্রিপুরা", "Uttar Pradesh": "উত্তর প্রদেশ", Uttarakhand: "উত্তরাখণ্ড", "West Bengal": "পশ্চিমবঙ্গ",
    Wheat: "গম", Rice: "ধান", Sugarcane: "আখ", Potato: "আলু", Maize: "ভুট্টা", Banana: "কला", Onion: "পেঁয়াজ", Groundnut: "চিনাবাদাম", Soyabean: "সয়াবিন", Sunflower: "সূর্যমুখী", Turmeric: "হলুদ", Coconut: "নারকেল", Gram: "ছোলা", Jute: "পাট", Tobacco: "তামাক", "Cotton(Lint)": "তুলা", "Arhar/Tur": "অড়হর ডাল", Bajra: "বাজরা", Ragi: "রাগী", Mustard: "সর্ষে"
  },
  te: {
    Kharif: "ఖరీఫ్", Rabi: "రబీ", Summer: "వేసవి", "Whole Year": "సంవత్సరం పొడవునా", Autumn: "శరదൃతువు", Winter: "శీతాకాలం",
    "Andhra Pradesh": "ఆంధ్ర ప్రదేశ్", "Arunachal Pradesh": "అరుణాచల ప్రదేశ్", Assam: "అస్సాం", Bihar: "బీహార్", Chhattisgarh: "ఛత్తీస్‌గఢ్", Delhi: "ఢిల్లీ", Goa: "గోవా", Gujarat: "గుజరాತ್", Haryana: "హర్యానా", "Himachal Pradesh": "హిమాచల్ ప్రదేశ్", "Jammu And Kashmir": "జమ్మూ మరియు కాశ్మీర్", Jharkhand: "ఝార్ఖండ్", Karnataka: "కర్ణాటక", Kerala: "కేరళ", "Madhya Pradesh": "మధ్య ప్రదేశ్", Maharashtra: "మహారాష్ట్ర", Manipur: "మణిపూర్", Meghalaya: "మేఘాలయ", Mizoram: "మిజోరాం", Nagaland: "నాగాలాండ్", Odisha: "ఒడిశా", Puducherry: "పుదుచ్చేరి", Punjab: "పంజాబ్", Sikkim: "సిక్కిం", "Tamil Nadu": "తమిళనాడు", Telangana: "తెలంగాణ", Tripura: "త్రిపుర", "Uttar Pradesh": "ఉత్తర ప్రదేశ్", Uttarakhand: "ఉత్తరాఖండ్", "West Bengal": "పశ్చిమ బెంగాల్",
    Wheat: "గోధుమ", Rice: "వరి", Sugarcane: "చెరకు", Potato: "బంగాళదుంప", Maize: "మొక్కజొన్న", Banana: "అరటి", Onion: "ఉల్లిపాయ", Groundnut: "వేరుశెనగ", Soyabean: "సోయాబీన్", Sunflower: "పొద్దుతిరుగుడు", Turmeric: "పసుపు", Coconut: "కొబ్బరి", Gram: "శనగ", Jute: "జనపనార", Tobacco: "పొగాకు", "Cotton(Lint)": "ప్రత్తి", "Arhar/Tur": "కందులు", Bajra: "సజ్జలు", Ragi: "రాగులు", Mustard: "ఆవాలు"
  },
  ta: {
    Kharif: "காரிஃப்", Rabi: "ரபி", Summer: "கோடை", "Whole Year": "முழு ஆண்டு", Autumn: "இலையுதிர்", Winter: "குளிர்",
    "Andhra Pradesh": "ஆந்திரப் பிரதேசம்", "Arunachal Pradesh": "அருணாச்சலப் பிரதேசம்", Assam: "அசாம்", Bihar: "பீகார்", Chhattisgarh: "சத்தீஸ்கர்", Delhi: "டெல்லி", Goa: "கோவா", Gujarat: "குஜராத்", Haryana: "ஹரியானா", "Himachal Pradesh": "ஹிமாச்சலப் பிரதேசம்", "Jammu And Kashmir": "ஜம்மு மற்றும் காஷ்மீர்", Jharkhand: "ஜார்கண்ட்", Karnataka: "கர்நாடகா", Kerala: "கேரளா", "Madhya Pradesh": "மத்தியப் பிரதேசம்", Maharashtra: "மகாராஷ்டிரா", Manipur: "மணிப்பூர்", Meghalaya: "மேகாலயா", Mizoram: "மிசோரம்", Nagaland: "நாகாலாந்து", Odisha: "ஒடிசா", Puducherry: "புதுச்சேரி", Punjab: "பஞ்சாப்", Sikkim: "சிக்கிம்", "Tamil Nadu": "தமிழ்நாடு", Telangana: "தெலுங்கானா", Tripura: "திரிபுரா", "Uttar Pradesh": "உத்தரப் பிரதேசம்", Uttarakhand: "உத்தரகாண்ட்", "West Bengal": "மேற்கு வங்காளம்",
    Wheat: "கோதுமை", Rice: "நெல்", Sugarcane: "கரும்பு", Potato: "உருளைக்கிழங்கு", Maize: "மக்காச்சோளம்", Banana: "வாழை", Onion: "வெங்காயம்", Groundnut: "நிலக்கடலை", Soyabean: "சோயாபீன்", Sunflower: "சூரியகாந்தி", Turmeric: "மஞ்சள்", Coconut: "தேங்காய்", Gram: "கடலை", Jute: "சணல்", Tobacco: "புகையிலை", "Cotton(Lint)": "பருத்தி", "Arhar/Tur": "துவரம் பருப்பு", Bajra: "கம்பு", Ragi: "கேழ்வரகு", Mustard: "கடுகு"
  },
  mr: {
    Kharif: "खरीप", Rabi: "रब्बी", Summer: "उन्हाळी", "Whole Year": "पूर्ण वर्ष", Autumn: "शरद", Winter: "हिवाळा",
    "Andhra Pradesh": "आंध्र प्रदेश", "Arunachal Pradesh": "अरुणाचल प्रदेश", Assam: "आसाम", Bihar: "बिहार", Chhattisgarh: "छत्तीसगड", Delhi: "दिल्ली", Goa: "गोवा", Gujarat: "गुजरात", Haryana: "हरियाणा", "Himachal Pradesh": "हिमाचल प्रदेश", "Jammu And Kashmir": "जम्मू आणि काश्मीर", Jharkhand: "झारखंड", Karnataka: "कर्नाटक", Kerala: "केरळ", "Madhya Pradesh": "मध्य प्रदेश", Maharashtra: "महाराष्ट्र", Manipur: "मणिपूर", Meghalaya: "मेघालय", Mizoram: "मिझोरम", Nagaland: "नागालँड", Odisha: "ओडिशा", Puducherry: "पुडुचेरी", Punjab: "पंजाब", Sikkim: "सिक्किम", "Tamil Nadu": "तमिळनाडू", Telangana: "तेलंगणा", Tripura: "त्रिपुरा", "Uttar Pradesh": "उत्तर प्रदेश", Uttarakhand: "उत्तराखंड", "West Bengal": "पश्चिम बंगाल",
    Wheat: "गहू", Rice: "भात", Sugarcane: "ऊस", Potato: "बटाटा", Maize: "मका", Banana: "केळी", Onion: "कांदा", Groundnut: "भूईमूग", Soyabean: "सोयाबीन", Sunflower: "सूर्यफूल", Turmeric: "हळद", Coconut: "नारळ", Gram: "हरभरा", Jute: "ताग", Tobacco: "तंबाखू", "Cotton(Lint)": "कापूस", "Arhar/Tur": "तूर", Bajra: "बाजरी", Ragi: "नाचणी", Mustard: "मोहरी"
  },
  gu: {
    Kharif: "ખરીફ", Rabi: "રવી", Summer: "ઉનાળુ", "Whole Year": "આખું વર્ષ", Autumn: "શરદ", Winter: "શિયાળુ",
    "Andhra Pradesh": "આંધ્ર પ્રદેશ", "Arunachal Pradesh": "અરુણાચલ પ્રદેશ", Assam: "આસામ", Bihar: "બિહાર", Chhattisgarh: "છત્તીસગઢ", Delhi: "દિલ્હી", Goa: "ગોવા", Gujarat: "ગુજરાત", Haryana: "હરિયાણા", "Himachal Pradesh": "હિમાચલ પ્રદેશ", "Jammu And Kashmir": "જમ્મુ અને કાશ્મીર", Jharkhand: "ઝારખંડ", Karnataka: "કર્ણાટક", Kerala: "કેરળ", "Madhya Pradesh": "મધ્ય પ્રદેશ", Maharashtra: "મહારાષ્ટ્ર", Manipur: "મણિપુર", Meghalaya: "મેઘાલય", Mizoram: "મિઝોરમ", Nagaland: "નાગાલેન્ડ", Odisha: "ઓડિશા", Puducherry: "પુડુચેરી", Punjab: "પંજાબ", Sikkim: "સિક્કિમ", "Tamil Nadu": "તમિલનાડુ", Telangana: "તેલંગાણા", Tripura: "ત્રિપુરા", "Uttar Pradesh": "ઉત્તર પ્રદેશ", Uttarakhand: "ઉત્તરાખંડ", "West Bengal": "પશ્ચિમ બંગાળ",
    Wheat: "ઘઉં", Rice: "ચોખા", Sugarcane: "શેરડી", Potato: "બટાકા", Maize: "મકાઈ", Banana: "કેળું", Onion: "ડુંગળી", Groundnut: "મગફળી", Soyabean: "સોયાબીન", Sunflower: "સૂર્યમુખી", Turmeric: "હળદર", Coconut: "નાળિયેર", Gram: "ચણા", Jute: "શણ", Tobacco: "તમાકુ", "Cotton(Lint)": "કપાસ", "Arhar/Tur": "તુવેર", Bajra: "બાજરી", Ragi: "રાગી", Mustard: "રાઈ"
  },
  kn: {
    Kharif: "ಖರೀಫ್", Rabi: "ರಬಿ", Summer: "ಬೇಸಿಗೆ", "Whole Year": "ವರ್ಷವಿಡೀ", Autumn: "ಶರತ್ಕಾಲ", Winter: "ಚಳಿಗಾಲ",
    "Andhra Pradesh": "ಆಂಧ್ರ ಪ್ರದೇಶ", "Arunachal Pradesh": "ಅರುಣಾಚಲ ಪ್ರದೇಶ", Assam: "ಅಸ್ಸಾಂ", Bihar: "ಬಿಹಾರ", Chhattisgarh: "ಛತ್ತೀಸ್‌ಗಢ", Delhi: "ದೆಹಲಿ", Goa: "ಗೋವಾ", Gujarat: "ಗುಜರಾತ್", Haryana: "ಹರಿಯಾಣ", "Himachal Pradesh": "ಹಿಮಾಚಲ ಪ್ರದೇಶ", "Jammu And Kashmir": "ಜಮ್ಮು ಮತ್ತು ಕಾಶ್ಮೀರ", Jharkhand: "ಝಾರ್ಖಂಡ್", Karnataka: "ಕರ್ನಾಟಕ", Kerala: "ಕೇರಳ", "Madhya Pradesh": "ಮಧ್ಯ ಪ್ರದೇಶ", Maharashtra: "ಮಹಾರಾಷ್ಟ್ರ", Manipur: "ಮಣಿಪುರ", Meghalaya: "ಮೇಘಾಲಯ", Mizoram: "ಮಿಜೋರಾಂ", Nagaland: "ನಾಗಾಲ್ಯಾಂಡ್", Odisha: "ಒಡಿಶಾ", Puducherry: "ಪುದುಚೇರಿ", Punjab: "ಪಂಜಾಬ್", Sikkim: "ಸಿಕ್ಕಿಂ", "Tamil Nadu": "ತಮಿಳುನಾಡು", Telangana: "ತೆಲಂಗಾಣ", Tripura: "ತ್ರಿಪುರ", "Uttar Pradesh": "ಉತ್ತರ ಪ್ರದೇಶ", Uttarakhand: "ಉತ್ತರಾಖಂಡ್", "West Bengal": "ಪಶ್ಚಿಮ ಬಂಗಾಳ",
    Wheat: "ಗೋಧಿ", Rice: "ಭತ್ತ", Sugarcane: "ಕಬ್ಬು", Potato: "ಆಲೂಗಡ್ಡೆ", Maize: "ಮೆಕ್ಕೆಜೋಳ", Banana: "ಬಾಳೆಹಣ್ಣು", Onion: "ಈರುಳ್ಳಿ", Groundnut: "ಕಡಲೇಕಾಯಿ", Soyabean: "ಸೋಯಾಬೀನ್", Sunflower: "ಸೂರ್ಯಕಾಂತಿ", Turmeric: "ಅರಿಶಿನ", Coconut: "ತೆಂಗಿನಕಾಯಿ", Gram: "ಕಡಲೆ", Jute: "ಸೆಣಬು", Tobacco: "ಹೊಗೆಸೊಪ್ಪು", "Cotton(Lint)": "ಹತ್ತಿ", "Arhar/Tur": "ತೊಗರಿ ಬೇಳೆ", Bajra: "ಸಜ್ಜೆ", Ragi: "ರಾಗಿ", Mustard: "ಸಾಸಿವೆ"
  },
  ml: {
    Kharif: "ഖാരിഫ്", Rabi: "റബി", Summer: "വേനൽക്കാലം", "Whole Year": "വർഷം മുഴുവൻ", Autumn: "ശരത്കാലം", Winter: "ശീതകാലം",
    "Andhra Pradesh": "ആന്ധ്ര പ്രദേശ്", "Arunachal Pradesh": "അരുണാചൽ പ്രദേശ്", Assam: "അസം", Bihar: "ബിഹാർ", Chhattisgarh: "ഛത്തീസ്ഗഢ്", Delhi: "ഡൽഹി", Goa: "ഗോവ", Gujarat: "ഗുജറാത്ത്", Haryana: "ഹരിയാന", "Himachal Pradesh": "ഹിമാചൽ പ്രദേശ്", "Jammu And Kashmir": "ജമ്മു കാശ്മീർ", Jharkhand: "ഝാർഖണ്ഡ്", Karnataka: "കർണാടക", Kerala: "കേരളം", "Madhya Pradesh": "മധ്യ പ്രദേശ്", Maharashtra: "മഹാരാഷ്ട്ര", Manipur: "മണിപ്പൂർ", Meghalaya: "മേഘാലയ", Mizoram: "മിസോറം", Nagaland: "നാഗാലാൻഡ്", Odisha: "ഒഡീഷ", Puducherry: "പുതുച്ചേരി", Punjab: "പഞ്ചാബ്", Sikkim: "സിക്കിം", "Tamil Nadu": "തമിഴ്നാട്", Telangana: "തെലങ്കാന", Tripura: "ത്രിപുര", "Uttar Pradesh": "ഉത്തർ പ്രദേശ്", Uttarakhand: "ഉത്തരാഖണ്ഡ്", "West Bengal": "പശ്ചിമ ബംഗാൾ",
    Wheat: "ഗോതമ്പ്", Rice: "നെല്ല്", Sugarcane: "കരിമ്പ്", Potato: "ഉരുളക്കിഴങ്ങ്", Maize: "ചോളം", Banana: "വാഴപ്പഴം", Onion: "ഉള്ളി", Groundnut: "നിലക്കടല", Soyabean: "സോയാബീൻ", Sunflower: "സൂര്യകാന്തി", Turmeric: "മഞ്ഞൾ", Coconut: "തേങ്ങ", Gram: "കടല", Jute: "ചണം", Tobacco: "പുകയില", "Cotton(Lint)": "പരുത്തി", "Arhar/Tur": "തുവരപ്പരിപ്പ്", Bajra: "കമ്പ്", Ragi: "റാഗി", Mustard: "കടുക്"
  },
  pa: {
    Kharif: "ਖ਼ਰੀਫ਼", Rabi: "ਹਾੜ੍ਹੀ (ਰਬੀ)", Summer: "ਗਰਮੀ ਦੀ ਫ਼ਸਲ", "Whole Year": "ਪੂਰਾ ਸਾਲ", Autumn: "ਪਤਝੜ", Winter: "ਸਿਆਲ",
    "Andhra Pradesh": "ਆਂਧ੍ਰ ਪ੍ਰਦੇਸ਼", "Arunachal Pradesh": "ਅਰੁਣਾਚਲ ਪ੍ਰਦੇਸ਼", Assam: "ਅਸਾਮ", Bihar: "ਬਿਹਾਰ", Chhattisgarh: "ਛੱਤੀਸਗੜ੍ਹ", Delhi: "ਦਿੱਲੀ", Goa: "ਗੋਆ", Gujarat: "ਗੁਜਰਾਤ", Haryana: "ਹਰਿਆਣਾ", "Himachal Pradesh": "ਹਿਮਾਚਲ ਪ੍ਰਦੇਸ਼", "Jammu And Kashmir": "ਜੰਮੂ ਅਤੇ ਕਸ਼ਮੀਰ", Jharkhand: "ਝਾਰਖੰਡ", Karnataka: "ਕਰਨਾਟਕ", Kerala: "ਕੇਰਲ", "Madhya Pradesh": "ਮੱਧ ਪ੍ਰਦੇਸ਼", Maharashtra: "ਮਹਾਰਾਸ਼ਟਰ", Manipur: "ਮਣੀਪੁਰ", Meghalaya: "ਮੇਘਾਲਯਾ", Mizoram: "ਮਿਜ਼ੋਰਮ", Nagaland: "ਨਾਗਾਲੈਂਡ", Odisha: "ਓਡਿਸ਼ਾ", Puducherry: "ਪੁਡੁਚੇਰੀ", Punjab: "ਪੰਜਾਬ", Sikkim: "ਸਿੱਕਿਮ", "Tamil Nadu": "ਤਾਮਿਲਨਾਡੂ", Telangana: "ਤੇਲੰਗਾਨਾ", Tripura: "ਤ੍ਰਿਪੁਰਾ", "Uttar Pradesh": "ਉੱਤਰ ਪ੍ਰਦੇਸ਼", Uttarakhand: "ਉੱਤਰਾਖੰਡ", "West Bengal": "ਪੱਛਮੀ ਬੰਗਾਲ",
    Wheat: "ਕਣਕ", Rice: "ਝੋਨਾ (ਚਾਵਲ)", Sugarcane: "ਗੰਨਾ", Potato: "ਆਲੂ", Maize: "ਮੱਕੀ", Banana: "ਕੇਲਾ", Onion: "ਗੰਢਾ (ਪਿਆਜ)", Groundnut: "ਮੂੰਗਫਲੀ", Soyabean: "ਸੋਇਆਬੀਨ", Sunflower: "ਸੂਰਜਮੁਖੀ", Turmeric: "ਹਲਦੀ", Coconut: "ਨਾਰੀਅਲ", Gram: "ਛੋਲੇ", Jute: "ਪਟਸਨ", Tobacco: "ਤੰਬਾਕੂ", "Cotton(Lint)": "ਕਪਾਹ", "Arhar/Tur": "ਅਰਹਰ", Bajra: "ਬਾਜਰਾ", Ragi: "ਰਾਗੀ", Mustard: "ਸਰ੍ਹੋਂ"
  },
  ne: {
    Kharif: "खरीफ", Rabi: "रबी", Summer: "गर्मी", "Whole Year": "वर्षभर", Autumn: "शरद", Winter: "शिशिर",
    "Andhra Pradesh": "आन्ध्र प्रदेश", "Arunachal Pradesh": "अरुणाचल प्रदेश", Assam: "असम", Bihar: "बिहार", Chhattisgarh: "छत्तीसगढ", Delhi: "दिल्ली", Goa: "गोवा", Gujarat: "गुजरात", Haryana: "हरियाणा", "Himachal Pradesh": "हिमाचल प्रदेश", "Jammu And Kashmir": "जम्मू र कश्मीर", Jharkhand: "झारखण्ड", Karnataka: "कर्नाटक", Kerala: "केरल", "Madhya Pradesh": "मध्य प्रदेश", Maharashtra: "महाराष्ट्र", Manipur: "मणिपुर", Meghalaya: "मेघालय", Mizoram: "मिजोरम", Nagaland: "नागाल्याण्ड", Odisha: "ओडिशा", Puducherry: "पुडुचेरी", Punjab: "पञ्जाब", Sikkim: "सिक्किम", "Tamil Nadu": "तमिलनाडु", Telangana: "तेलंगाना", Tripura: "त्रिपुरा", "Uttar Pradesh": "उत्तर प्रदेश", Uttarakhand: "उत्तराखण्ड", "West Bengal": "पश्चिम बंगाल",
    Wheat: "गहुँ", Rice: "धान", Sugarcane: "उखु", Potato: "आलु", Maize: "मकै", Banana: "केरा", Onion: "प्याज", Groundnut: "बदाम", Soyabean: "भटमास", Sunflower: "सूर्यमुखी", Turmeric: "बेसार", Coconut: "नारिवल", Gram: "चना", Jute: "पटसन", Tobacco: "सुर्ती", "Cotton(Lint)": "कपास", "Arhar/Tur": "रहर", Bajra: "बाजरा", Ragi: "कोदो", Mustard: "तोरी"
  }
};
const stateNameTranslations = {
  hi: {
    "Andhra Pradesh": "आंध्र प्रदेश", "Arunachal Pradesh": "अरुणाचल प्रदेश", Assam: "असम", Bihar: "बिहार", Chhattisgarh: "छत्तीसगढ़", Delhi: "दिल्ली", Goa: "गोवा", Gujarat: "गुजरात", Haryana: "हरियाणा", "Himachal Pradesh": "हिमाचल प्रदेश", "Jammu And Kashmir": "जम्मू और कश्मीर", Jharkhand: "झारखंड", Karnataka: "कर्नाटक", Kerala: "केरल", "Madhya Pradesh": "मध्य प्रदेश", Maharashtra: "महाराष्ट्र", Manipur: "मणिपुर", Meghalaya: "मेघालय", Mizoram: "मिजोरम", Nagaland: "नागालैंड", Odisha: "ओडिशा", Puducherry: "पुडुचेरी", Punjab: "पंजाब", Sikkim: "सिक्किम", "Tamil Nadu": "तमिलनाडु", Telangana: "तेलंगाना", Tripura: "त्रिपुरा", "Uttar Pradesh": "उत्तर प्रदेश", Uttarakhand: "उत्तराखंड", "West Bengal": "पश्चिम बंगाल"
  },
  bn: {
    "Andhra Pradesh": "অন্ধ্র প্রদেশ", "Arunachal Pradesh": "অরুণাচল প্রদেশ", Assam: "আসাম", Bihar: "বিহার", Chhattisgarh: "ছত্তীসগড়", Delhi: "দিল্লি", Goa: "গোয়া", Gujarat: "গুজরাট", Haryana: "হরিয়ানা", "Himachal Pradesh": "হিমাচল প্রদেশ", "Jammu And Kashmir": "জম্মু ও কাশ্মীর", Jharkhand: "ঝাড়খণ্ড", Karnataka: "কর্ণাটক", Kerala: "কেরালা", "Madhya Pradesh": "মধ্য প্রদেশ", Maharashtra: "মহারাষ্ট্র", Manipur: "মণিপুর", Meghalaya: "মেঘালয়", Mizoram: "মিজোরাম", Nagaland: "নাগাল্যান্ড", Odisha: "ওডিশা", Puducherry: "পুদুচেরি", Punjab: "পাঞ্জাব", Sikkim: "সিকিম", "Tamil Nadu": "তামিলনাড়ু", Telangana: "তেলেঙ্গানা", Tripura: "ত্রিপুরা", "Uttar Pradesh": "উত্তর প্রদেশ", Uttarakhand: "উত্তরাখণ্ড", "West Bengal": "পশ্চিমবঙ্গ"
  },
  te: {
    "Andhra Pradesh": "ఆంధ్ర ప్రదేశ్", "Arunachal Pradesh": "అరుణాచల ప్రదేశ్", Assam: "అస్సాం", Bihar: "బీహార్", Chhattisgarh: "ఛత్తీస్‌గఢ్", Delhi: "ఢిల్లీ", Goa: "గోవా", Gujarat: "గుజరాత్", Haryana: "హర్యానా", "Himachal Pradesh": "హిమాచల్ ప్రదేశ్", "Jammu And Kashmir": "జమ్మూ మరియు కాశ్మీర్", Jharkhand: "ఝార్ఖండ్", Karnataka: "కర్ణాటక", Kerala: "కేరళ", "Madhya Pradesh": "మధ్య ప్రదేశ్", Maharashtra: "మహారాష్ట్ర", Manipur: "మణిపూర్", Meghalaya: "మేఘాలయ", Mizoram: "మిజోరాం", Nagaland: "నాగాలాండ్", Odisha: "ఒడిశా", Puducherry: "పుదుచ్చేరి", Punjab: "పంజాబ్", Sikkim: "సిక్కిం", "Tamil Nadu": "తమిళనాడు", Telangana: "తెలంగాణ", Tripura: "త్రిపుర", "Uttar Pradesh": "ఉత్తర ప్రదేశ్", Uttarakhand: "ఉత్తరాఖండ్", "West Bengal": "పశ్చిమ బెంగాల్"
  },
  ta: {
    "Andhra Pradesh": "ஆந்திரப் பிரதேசம்", "Arunachal Pradesh": "அருணாச்சலப் பிரதேசம்", Assam: "அசாம்", Bihar: "பீகார்", Chhattisgarh: "சத்தீஸ்கர்", Delhi: "டெல்லி", Goa: "கோவா", Gujarat: "குஜராத்", Haryana: "ஹரியானா", "Himachal Pradesh": "ஹிமாச்சலப் பிரதேசம்", "Jammu And Kashmir": "ஜம்மு மற்றும் காஷ்மீர்", Jharkhand: "ஜார்கண்ட்", Karnataka: "கர்நாடகா", Kerala: "கேரளா", "Madhya Pradesh": "மத்தியப் பிரதேசம்", Maharashtra: "மகாராஷ்டிரா", Manipur: "மணிப்பூர்", Meghalaya: "மேகாலயா", Mizoram: "மிசோரம்", Nagaland: "நாகாலாந்து", Odisha: "ஒடிசா", Puducherry: "புதுச்சேரி", Punjab: "பஞ்சாப்", Sikkim: "சிக்கிம்", "Tamil Nadu": "தமிழ்நாடு", Telangana: "தெலுங்கானா", Tripura: "திரிபுரா", "Uttar Pradesh": "உத்தரப் பிரதேசம்", Uttarakhand: "உத்தரகாண்ட்", "West Bengal": "மேற்கு வங்காளம்"
  },
  mr: {
    "Andhra Pradesh": "आंध्र प्रदेश", "Arunachal Pradesh": "अरुणाचल प्रदेश", Assam: "आसाम", Bihar: "बिहार", Chhattisgarh: "छत्तीसगड", Delhi: "दिल्ली", Goa: "गोवा", Gujarat: "गुजरात", Haryana: "हरियाणा", "Himachal Pradesh": "हिमाचल प्रदेश", "Jammu And Kashmir": "जम्मू आणि काश्मीर", Jharkhand: "झारखंड", Karnataka: "कर्नाटक", Kerala: "केरळ", "Madhya Pradesh": "मध्य प्रदेश", Maharashtra: "महाराष्ट्र", Manipur: "मणिपूर", Meghalaya: "मेघालय", Mizoram: "मिझोरम", Nagaland: "नागालँड", Odisha: "ओडिशा", Puducherry: "पुडुचेरी", Punjab: "पंजाब", Sikkim: "सिक्किम", "Tamil Nadu": "तमिळनाडू", Telangana: "तेलंगणा", Tripura: "त्रिपुरा", "Uttar Pradesh": "उत्तर प्रदेश", Uttarakhand: "उत्तराखंड", "West Bengal": "पश्चिम बंगाल"
  },
  gu: {
    "Andhra Pradesh": "આંધ્ર પ્રદેશ", "Arunachal Pradesh": "અરુણાચલ પ્રદેશ", Assam: "આસામ", Bihar: "બિહાર", Chhattisgarh: "છત્તીસગઢ", Delhi: "દિલ્હી", Goa: "ગોવા", Gujarat: "ગુજરાત", Haryana: "હરિયાણા", "Himachal Pradesh": "હિમાચલ પ્રદેશ", "Jammu And Kashmir": "જમ્મુ અને કાશ્મીર", Jharkhand: "ઝારખંડ", Karnataka: "કર્ણાટક", Kerala: "કેરળ", "Madhya Pradesh": "મધ્ય પ્રદેશ", Maharashtra: "મહારાષ્ટ્ર", Manipur: "મણિપુર", Meghalaya: "મેઘાલય", Mizoram: "મિઝોરમ", Nagaland: "નાગાલેન્ડ", Odisha: "ઓડિશા", Puducherry: "પુડુચેરી", Punjab: "પંજાબ", Sikkim: "સિક્કિમ", "Tamil Nadu": "તમિલનાડુ", Telangana: "તેલંગાણા", Tripura: "ત્રિપુરા", "Uttar Pradesh": "ઉત્તર પ્રદેશ", Uttarakhand: "ઉત્તરાખંડ", "West Bengal": "પશ્ચિમ બંગાળ"
  },
  kn: {
    "Andhra Pradesh": "ಆಂಧ್ರ ಪ್ರದೇಶ", "Arunachal Pradesh": "ಅರುಣಾಚಲ ಪ್ರದೇಶ", Assam: "ಅಸ್ಸಾಂ", Bihar: "ಬಿಹಾರ", Chhattisgarh: "ಛತ್ತೀಸ್‌ಗಢ", Delhi: "ದೆಹಲಿ", Goa: "ಗೋವಾ", Gujarat: "ಗುಜರಾತ್", Haryana: "ಹರಿಯಾಣ", "Himachal Pradesh": "ಹಿಮಾಚಲ ಪ್ರದೇಶ", "Jammu And Kashmir": "ಜಮ್ಮು ಮತ್ತು ಕಾಶ್ಮೀರ", Jharkhand: "ಝಾರ್ಖಂಡ್", Karnataka: "ಕರ್ನಾಟಕ", Kerala: "ಕೇರಳ", "Madhya Pradesh": "ಮಧ್ಯ ಪ್ರದೇಶ", Maharashtra: "ಮಹಾರಾಷ್ಟ್ರ", Manipur: "ಮಣಿಪುರ", Meghalaya: "ಮೇಘಾಲಯ", Mizoram: "ಮಿಜೋರಾಂ", Nagaland: "ನಾಗಾಲ್ಯಾಂಡ್", Odisha: "ಒಡಿಶಾ", Puducherry: "ಪುದುಚೇರಿ", Punjab: "ಪಂಜಾಬ್", Sikkim: "ಸಿಕ್ಕಿಂ", "Tamil Nadu": "ತಮಿಳುನಾಡು", Telangana: "ತೆಲಂಗಾಣ", Tripura: "ತ್ರಿಪುರ", "Uttar Pradesh": "ಉತ್ತರ ಪ್ರದೇಶ", Uttarakhand: "ಉತ್ತರಾಖಂಡ್", "West Bengal": "ಪಶ್ಚಿಮ ಬಂಗಾಳ"
  },
  ml: {
    "Andhra Pradesh": "ആന്ധ്ര പ്രദേശ്", "Arunachal Pradesh": "അരുണാചൽ പ്രദേശ്", Assam: "അസം", Bihar: "ബിഹാർ", Chhattisgarh: "ഛത്തീസ്ഗഢ്", Delhi: "ഡൽഹി", Goa: "ഗോവ", Gujarat: "ഗുജറാത്ത്", Haryana: "ഹരിയാന", "Himachal Pradesh": "ഹിമാചൽ പ്രദേശ്", "Jammu And Kashmir": "ജമ്മു മറ്റും കാശ്മീർ", Jharkhand: "ഝാർഖണ്ഡ്", Karnataka: "കർണാടക", Kerala: "കേരളം", "Madhya Pradesh": "മധ്യ പ്രദേശ്", Maharashtra: "മഹാരാഷ്ട്ര", Manipur: "മണിപ്പൂർ", Meghalaya: "മേഘാലയ", Mizoram: "മിസോറം", Nagaland: "നാഗാലാൻഡ്", Odisha: "ഒഡീഷ", Puducherry: "പുതുച്ചേരി", Punjab: "പഞ്ചാב്", Sikkim: "സിക്കിമ്", "Tamil Nadu": "തമിഴ്നാട്", Telangana: "തെലങ്കാന", Tripura: "ത്രിപുര", "Uttar Pradesh": "ඉതුරු പ්‍රදේශය", Uttarakhand: "ඉතුරාකණ්ඩ්", "West Bengal": "වසන්ත බන්ගල්"
  },
  pa: {
    "Andhra Pradesh": "ਆਂਧ੍ਰ ਪ੍ਰਦੇਸ਼", "Arunachal Pradesh": "ਅਰੁਣਾਚਲ ਪ੍ਰਦੇਸ਼", Assam: "ਅਸਾਮ", Bihar: "ਬਿਹਾਰ", Chhattisgarh: "ਛੱਤੀਸਗੜ੍ਹ", Delhi: "ਦਿੱਲੀ", Goa: "ਗੋਆ", Gujarat: "ਗੁਜਰਾਤ", Haryana: "ਹਰਿਆਣਾ", "Himachal Pradesh": "ਹਿਮਾਚਲ ਪ੍ਰਦੇਸ਼", "Jammu And Kashmir": "ਜੰਮੂ ਅਤੇ ਕਸ਼ਮੀਰ", Jharkhand: "ਝਾਰਖੰਡ", Karnataka: "ਕਰਨਾਟਕ", Kerala: "ਕੇਰਲ", "Madhya Pradesh": "ਮੱਧ ਪ੍ਰਦੇਸ਼", Maharashtra: "ਮਹਾਰਾਸ਼ਟਰ", Manipur: "ਮਣੀਪੁਰ", Meghalaya: "ਮੇਘਾਲਯਾ", Mizoram: "ਮਿਜ਼ੋਰਮ", Nagaland: "ਨਾਗਾਲੈਂਡ", Odisha: "ਓਡਿਸ਼ਾ", Puducherry: "ਪੁਡੁਚੇਰੀ", Punjab: "ਪੰਜਾਬ", Sikkim: "ਸਿੱਕਿਮ", "Tamil Nadu": "ਤਾਮਿਲਨਾਡੂ", Telangana: "ਤੇਲੰਗਾਨਾ", Tripura: "ਤ੍ਰਿਪੁਰਾ", "Uttar Pradesh": "ਉੱਤਰ ਪ੍ਰਦੇਸ਼", Uttarakhand: "ਉੱਤਰਾਖੰਡ", "West Bengal": "ਪੱਛਮੀ ਬੰਗਾਲ"
  },
  ne: {
    "Andhra Pradesh": "आन्ध्र प्रदेश", "Arunachal Pradesh": "अरुणाचल प्रदेश", Assam: "असम", Bihar: "बिहार", Chhattisgarh: "छत्तीसगढ", Delhi: "दिल्ली", Goa: "गोवा", Gujarat: "गुजरात", Haryana: "हरियाणा", "Himachal Pradesh": "हिमाचल प्रदेश", "Jammu And Kashmir": "जम्मू र कश्मीर", Jharkhand: "झारखण्ड", Karnataka: "कर्नाटक", Kerala: "केरल", "Madhya Pradesh": "मध्य प्रदेश", Maharashtra: "महाराष्ट्र", Manipur: "मणिपुर", Meghalaya: "मेघालय", Mizoram: "मिजोरम", Nagaland: "नागाल्याण्ड", Odisha: "ओडिशा", Puducherry: "पुडुचेरी", Punjab: "पञ्जाब", Sikkim: "सिक्किम", "Tamil Nadu": "तमिलनाडु", Telangana: "तेलंगाना", Tripura: "त्रिपुरा", "Uttar Pradesh": "उत्तर प्रदेश", Uttarakhand: "उत्तराखण्ड", "West Bengal": "पश्चिम बंगाल"
  }
};

Object.entries(stateNameTranslations).forEach(([lang, translations]) => {
  optionTranslations[lang] = { ...(optionTranslations[lang] || {}), ...translations };
});

function displayOption(value) {
  const map= optionTranslations[state.lang] || {};
  return map[value] || value;
}

function t(key) {
  return (i18n[state.lang] && i18n[state.lang][key]) || i18n.en[key] || key;
}

function applyLanguage() {
  document.querySelectorAll("[data-i18n]").forEach(node => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  refreshSelectText("state");
  refreshSelectText("crop");
  refreshSelectText("season");
  refreshSelectText("variety");
  refreshSelectText("district");
}

function showPage(id) {
  // Enforce login: Redirect to login page if trying to access any other page while not logged in
  if (!state.isLoggedIn && id !== 'login') {
    id = 'login';
  }
  
  document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.id === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setOptions(select, values, preferred) {
  select.innerHTML = "";
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = displayOption(value);
    select.appendChild(option);
  });
  if (preferred && values.includes(preferred)) {
    select.value = preferred;
  }
}

function refreshSelectText(id) {
  const select = document.getElementById(id);
  if (!select) return;
  Array.from(select.options).forEach(option => {
    option.textContent = displayOption(option.value);
  });
}

function updateVarieties() {
  const cropName = document.getElementById("crop").value;
  const varieties = state.options?.varietiesByCrop?.[cropName] || state.options?.varieties || ["General"];
  const current = document.getElementById("variety").value;
  setOptions(document.getElementById("variety"), varieties, current || varieties[0]);
}

function updateDistricts() {
  const stateName = document.getElementById("state").value;
  const districtField = document.getElementById("districtField");
  const districtSelect = document.getElementById("district");
  const districts = state.options?.districtsByState?.[stateName] || [];

  if (!districts.length) {
    districtField?.classList.add("hidden");
    if (districtSelect) {
      districtSelect.innerHTML = "";
      districtSelect.disabled = true;
    }
    return;
  }

  districtField?.classList.remove("hidden");
  if (districtSelect) {
    const current = districtSelect.value;
    setOptions(districtSelect, districts, current || districts[0]);
    districtSelect.disabled = false;
  }
}

function updateRainfallRange() {
  const stateName = document.getElementById("state").value;
  const seasonName = document.getElementById("season").value;
  const recommendation = state.options?.rainfallRanges?.[`${stateName}|${seasonName}`];
  const rain = document.getElementById("rainfall");
  rain.min = 0;
  rain.max = 6000;
  if (recommendation) {
    const recKey = `${stateName}|${seasonName}`;
    if (rain.dataset.recommendationKey !== recKey || Number(rain.value) < rain.min || Number(rain.value) > rain.max) {
      rain.value = Math.max(rain.min, Math.min(rain.max, Math.round(recommendation.median)));
      rain.dataset.recommendationKey = recKey;
    }
    const seasonLabel = displayOption(seasonName);
    const stateLabel = displayOption(stateName);
    document.getElementById("rainfallRecommendation").textContent = `${t("rainfallRecommendationSeason").replace("{season}", seasonLabel).replace("{state}", stateLabel)} ${Number(recommendation.min).toLocaleString("en-IN")} - ${Number(recommendation.max).toLocaleString("en-IN")} mm.`;
  } else {
    delete rain.dataset.recommendationKey;
    document.getElementById("rainfallRecommendation").textContent = t("rainfallRecommendation");
  }
  document.getElementById("rainfallValue").textContent = `${Number(rain.value).toLocaleString("en-IN")} mm`;
}

function updateWeatherStatus(message, isError = false) {
  const status = document.getElementById("weatherStatus");
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? "#b91c1c" : "var(--green-900)";
}

async function fetchLiveWeather() {
  const button = document.getElementById("liveWeatherButton");
  if (button) button.disabled = true;
  updateWeatherStatus("Detecting location...");

  if (!navigator.geolocation) {
    updateWeatherStatus("Geolocation is not supported by your browser.", true);
    if (button) button.disabled = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(async position => {
    const { latitude, longitude } = position.coords;
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`);
      const data = await response.json();
      const current = data?.current_weather;
      if (current && typeof current.temperature === "number") {
        const tempField = document.getElementById("temperature");
        if (tempField) tempField.value = current.temperature.toFixed(1);
        updateWeatherStatus(`Live weather set: ${current.temperature.toFixed(1)}°C from current location.`);
      } else {
        updateWeatherStatus("Unable to retrieve live weather. Try again.", true);
      }
    } catch (error) {
      console.error("Live weather error:", error);
      updateWeatherStatus("Live weather fetch failed.", true);
    } finally {
      if (button) button.disabled = false;
    }
  }, error => {
    updateWeatherStatus("Location access denied or unavailable.", true);
    if (button) button.disabled = false;
  }, {
    timeout: 15000,
    maximumAge: 60000,
    enableHighAccuracy: false
  });
}

async function loadOptions() {
  const response = await fetch("/api/options");
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || "Unable to load model options.");
  }
  state.options = data;
  setOptions(document.getElementById("state"), data.states, "Punjab");
  setOptions(document.getElementById("crop"), data.crops, "Wheat");
  setOptions(document.getElementById("season"), data.seasons, "Rabi");
  setOptions(document.getElementById("variety"), data.varieties || ["General"], "HD-2967");
  updateDistricts();
  if (data.years?.length) {
    document.getElementById("year").value = Math.max(...data.years);
  }
  updateRainfallRange();
}

function formPayload() {
  return {
    state: document.getElementById("state").value,
    district: document.getElementById("district")?.value || "",
    crop: document.getElementById("crop").value,
    variety: document.getElementById("variety").value,
    season: document.getElementById("season").value,
    year: Number(document.getElementById("year").value),
    area: Number(document.getElementById("area").value),
    seed: Number(document.getElementById("seed").value),
    fertilizer: Number(document.getElementById("fertilizer").value),
    pesticide: Number(document.getElementById("pesticide").value),
    rainfall: Number(document.getElementById("rainfall").value),
    temperature: Number(document.getElementById("temperature").value),
    productionCost: Number(document.getElementById("productionCost").value),
    useCustomCost: document.getElementById("useCustomCost").checked,
    climateStress: Number(document.getElementById("climateStress").value),
    soilNutrient: Number(document.getElementById("soilNutrient").value)
  };
}

function renderResult(result) {
  result.input = result.input || state.latestInput || {};
  result.xai = result.xai || buildXaiReport(result, result.input);
  state.latestReport = result;
  document.getElementById("resultPanel").classList.remove("hidden");
  document.getElementById("yieldValue").textContent = result.yield.toFixed(2);
  document.getElementById("mspValue").textContent = rupee.format(result.marketPrice || result.msp);
  document.getElementById("revenueValue").textContent = rupee.format(result.revenue);
  document.getElementById("profitValue").textContent = rupee.format(result.profit);
  document.getElementById("roiValue").textContent = `${result.roi.toFixed(1)}%`;
  document.getElementById("statusLabel").textContent = displayOption(result.label);
  document.getElementById("statusNote").textContent = `${result.note} Model group: ${result.cropGroup}.`;
  document.getElementById("statusCard").style.borderLeftColor = result.color || "#047857";
  openReportDialog(result);
}

function escapePdfText(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildXaiReport(result, input = {}) {
  const predictedYield = Number(result.yield || 0);
  const baselineYield = Number(result.baselineYield || 25);
  const ratio = baselineYield > 0 ? predictedYield / baselineYield : 1;
  const roi = Number(result.roi || 0);
  const soil = Number(input.soilNutrient ?? 0.5);
  const stress = Math.abs(Number(input.climateStress ?? 0));
  const rainfall = Number(input.rainfall ?? 0);
  const fertilizer = Number(input.fertilizer ?? 0);
  const pesticide = Number(input.pesticide ?? 0);
  const seed = Number(input.seed ?? 0);
  const cost = Number(result.cost || 0);
  const profit = Number(result.profit || 0);
  const revenue = Number(result.revenue || 0);
  const yieldScore = clamp(ratio * 80, 1, 80);
  const financeScore = clamp((roi + 50) / 2, 0, 40);
  const soilScore = clamp(soil * 24, 0, 24);
  const stressPenalty = clamp(stress * 12, 0, 24);
  const inputBalance = clamp((rainfall / Math.max(fertilizer, 1)) * 2, 0, 16);
  const tier = Math.round(clamp(yieldScore + financeScore + soilScore + inputBalance - stressPenalty, 1, 160));
  const marketPrice = Number(result.marketPrice || result.msp);
  const priceAdj = ((marketPrice / (result.msp || 1)) - 1) * 100;
  const verdict = tier >= 125 ? "high-confidence productive zone" : tier >= 90 ? "commercially stable zone" : tier >= 55 ? "watch-and-adjust zone" : "high-risk intervention zone";
  const summary = `Tier ${tier} of 160 places this prediction in the ${verdict}. The tier combines yield against local baseline, ROI, rainfall-fertilizer balance, soil nutrient index, and climate stress so the result is explainable instead of a black box.`;
  const factors = [
    `Yield signal: ${predictedYield.toFixed(2)} Q/Ha against a local baseline of ${baselineYield.toFixed(2)} Q/Ha gives a ${(ratio * 100).toFixed(1)}% productivity ratio.`,
    `Finance signal: revenue ${rupee.format(revenue)} minus cost ${rupee.format(cost)} gives profit ${rupee.format(profit)} and ROI ${roi.toFixed(1)}%.`,
    `Rainfall signal: selected annual rainfall is ${rainfall.toLocaleString("en-IN")} mm for ${result.state} during ${result.season}.`,
    `Input balance: fertilizer ${fertilizer.toFixed(1)} kg/ha, seed ${seed.toFixed(1)} kg/ha, and pesticide ${pesticide.toFixed(1)} kg/ha are evaluated with rainfall instead of alone.`,
    `Soil and climate: soil nutrient index ${soil.toFixed(2)} supports the score, while climate stress ${Number(input.climateStress ?? 0).toFixed(1)} reduces confidence when stress is high.`,
    `Market Dynamics: Price adjusted by ${priceAdj.toFixed(1)}% from base MSP due to simulated mandi volatility and quality premium.`,
    `Model path: ${result.engine || "SASYAM grouped ExtraTrees v4"} selected crop group ${result.cropGroup}, then applied the crop/state calibration and performance tier.`,
    `Decision note: ${result.note}`
  ];
  return { tier, summary, factors };
}

function getXaiReport(result = state.latestReport) {
  if (!result) return null;
  result.xai = result.xai || buildXaiReport(result, result.input || state.latestInput || {});
  return result.xai;
}

function openReportDialog(result) {
  const modal = document.getElementById("reportModal");
  if (!modal) return;
  const xai = getXaiReport(result);
  document.getElementById("dialogTitle").textContent = t("reportTitle");
  document.getElementById("dialogDescription").textContent = t("reportDescription");
  document.getElementById("dialogYieldLabel").textContent = t("yieldLabel");
  document.getElementById("dialogProfitLabel").textContent = t("profitLabel");
  document.getElementById("dialogRoiLabel").textContent = t("roiLabel");
  document.getElementById("dialogTierLabel").textContent = t("xaiTierLabel");
  document.getElementById("dialogYield").textContent = `${Number(result.yield || 0).toFixed(2)} Q/Ha`;
  document.getElementById("dialogProfit").textContent = rupee.format(result.profit || 0);
  document.getElementById("dialogRoi").textContent = `${Number(result.roi || 0).toFixed(1)}%`;
  document.getElementById("dialogTier").textContent = `${xai.tier}/160`;
  document.getElementById("xaiTierTitle").textContent = `${t("xaiTitle")}: Tier ${xai.tier}`;
  document.getElementById("xaiSummary").textContent = xai.summary;
  const list = document.getElementById("xaiList");
  list.innerHTML = "";
  xai.factors.forEach((factor, index) => {
    const item = document.createElement("div");
    item.className = "xai-item";
    item.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><p>${factor}</p>`;
    list.appendChild(item);
  });
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeReportDialog() {
  document.getElementById("reportModal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function downloadPdfReport() {
  if (!state.latestReport) {
    // Only show in chat if available
    const box = document.getElementById("chatMessages");
    if (box) {
      addChatBubble("Generate the precision report first.", "bot");
    }
    return;
  }
  const r = state.latestReport;
  const xai = getXaiReport(r);
  const rows = [
    "SASYAM PRECISION REPORT",
    `Developer: Souvik Chakraborty`,
    `Crop: ${r.crop}`,
    `State: ${r.state}`,
    `Season: ${r.season}`,
    `Year: ${r.year}`,
    `Predicted Yield: ${Number(r.yield).toFixed(2)} Q/Ha`,
    `Est. Market Price: Rs. ${Number(r.marketPrice || r.msp).toLocaleString("en-IN")}`,
    `Revenue: Rs. ${Number(r.revenue).toLocaleString("en-IN")}`,
    `Cost: Rs. ${Number(r.cost).toLocaleString("en-IN")}`,
    `Net Profit: Rs. ${Number(r.profit).toLocaleString("en-IN")}`,
    `ROI: ${Number(r.roi).toFixed(1)}%`,
    `Status: ${r.label}`,
    `Engine Note: ${r.note}`,
    `Engine: ${r.engine || "SASYAM grouped ExtraTrees v4"}`,
    `160-Tier XAI: Tier ${xai.tier} of 160`,
    `XAI Summary: ${xai.summary}`,
    ...xai.factors.map((factor, index) => `XAI ${index + 1}: ${factor}`)
  ];
  const contentLines = ["BT", "/F1 18 Tf", "50 780 Td", `(${escapePdfText(rows[0])}) Tj`, "/F1 11 Tf"];
  rows.slice(1).forEach(line => {
    contentLines.push("0 -26 Td");
    contentLines.push(`(${escapePdfText(line)}) Tj`);
  });
  contentLines.push("ET");
  const stream = contentLines.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach(obj => {
    offsets.push(pdf.length);
    pdf += obj + "\n";
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Sasyam_${r.crop || "Report"}_Report.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

function addChatBubble(text, role) {
  const node = document.createElement("div");
  node.className = `chat-bubble ${role}`;
  node.textContent = text;
  const box = document.getElementById("chatMessages");
  box.appendChild(node);
  box.scrollTop = box.scrollHeight;
  return node;
}

function chatReportPayload() {
  const report = state.latestReport || {};
  const input = state.latestInput || report.input || {};
  return {
    state: report.state || input.state || "",
    crop: report.crop || input.crop || "",
    variety: report.variety || input.variety || "",
    season: report.season || input.season || "",
    cropGroup: report.cropGroup || "",
    yield: Number(report.yield || 0),
    msp: Number(report.marketPrice || report.msp || 0),
    revenue: Number(report.revenue || 0),
    cost: Number(report.cost || 0),
    profit: Number(report.profit || 0),
    roi: Number(report.roi || 0),
    label: report.label || "",
    note: report.note || "",
    rainfall: Number(input.rainfall || 0),
    fertilizer: Number(input.fertilizer || 0),
    climateStress: Number(input.climateStress || 0),
    soilNutrient: Number(input.soilNutrient || 0)
  };
}

async function submitChat(event) {
  event.preventDefault();
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;
  addChatBubble(message, "user");
  input.value = "";

  const thinkingBubble = addChatBubble("Thinking...", "bot");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, lang: state.lang, ...chatReportPayload() })
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "Chat failed.");
    thinkingBubble.textContent = data.reply;
  } catch (error) {
    thinkingBubble.textContent = error.message;
  }
}

function calculateBlackSwanLoss() {
  const eventConfig = [
    { id: "heatwaveEvent", factor: 0.12 },
    { id: "droughtEvent", factor: 0.14 },
    { id: "floodEvent", factor: 0.10 },
    { id: "cycloneEvent", factor: 0.16 }
  ];
  const selected = eventConfig.filter(item => document.getElementById(item.id)?.checked);
  const severity = Number(document.getElementById("blackSwanSeverity")?.value || 0);
  const result = document.getElementById("blackSwanResult");
  if (!result) return;

  if (!selected.length) {
    result.textContent = t("selectEvent");
    result.style.color = "#ffffff";
    return;
  }

  const baseLoss = selected.reduce((sum, item) => sum + item.factor, 0);
  const lossPercent = clamp(baseLoss * severity, 0, 99);
  result.innerHTML = `<strong>${t("lossEstimate")}:</strong> ${lossPercent.toFixed(1)}% ${t("lossSuffix")}`;
  result.style.color = "#ffffff";
}

async function submitForm(event) {
  event.preventDefault();
  const button = event.currentTarget.querySelector(".submit-action");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = t("sync");

  try{
    const payload = formPayload();
    state.latestInput = payload;
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || "Prediction failed.");
    }
    result.input = payload;
    renderResult(result);
  } catch (error) {
    console.error("Form submission error:", error);
    // Only show errors in chat, not as alerts
    const box = document.getElementById("chatMessages");
    if (box) {
      addChatBubble(`Error: ${error.message}`, "bot");
    } else {
      alert(`Error: ${error.message}`);
    }
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

document.querySelectorAll("[data-target]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.target));
});

document.getElementById("launchCalculator").addEventListener("click", () => showPage("calculator"));
document.getElementById("crop").addEventListener("change", updateVarieties);
document.getElementById("state").addEventListener("change", () => {
  updateDistricts();
  updateRainfallRange();
});
document.getElementById("season").addEventListener("change", updateRainfallRange);
document.getElementById("yieldForm").addEventListener("submit", submitForm);
document.getElementById("chatForm").addEventListener("submit", submitChat);
document.getElementById("downloadPdf").addEventListener("click", downloadPdfReport);
document.getElementById("dialogDownloadPdf").addEventListener("click", downloadPdfReport);
document.getElementById("closeReportDialog").addEventListener("click", closeReportDialog);
document.getElementById("reportModal").addEventListener("click", event => {
  if (event.target.id === "reportModal") closeReportDialog();
});
const liveWeatherButton = document.getElementById("liveWeatherButton");
if (liveWeatherButton) {
  liveWeatherButton.addEventListener("click", fetchLiveWeather);
}
document.getElementById("languageSelect").addEventListener("change", event => {
  state.lang = event.target.value;
  applyLanguage();
  if (state.options) {
    populateDropdowns(state.options); 
  }
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeReportDialog();
});

document.getElementById("climateStress").addEventListener("input", event => {
  document.getElementById("climateStressValue").textContent = Number(event.target.value).toFixed(1);
});

document.getElementById("soilNutrient").addEventListener("input", event => {
  document.getElementById("soilNutrientValue").textContent = Number(event.target.value).toFixed(2);
});

document.getElementById("blackSwanSeverity").addEventListener("input", event => {
  document.getElementById("blackSwanSeverityValue").textContent = `${Number(event.target.value)}%`;
});

document.getElementById("calculateBlackSwan").addEventListener("click", calculateBlackSwanLoss);

document.getElementById("rainfall").addEventListener("input", event => {
  const rain = event.target;
  document.getElementById("rainfallValue").textContent = `${Number(rain.value).toLocaleString("en-IN")} mm`;
});
function populateDropdowns(options) {
  state.options = options;
  
  populateSelect("state", options.states);
  populateSelect("crop", options.crops);
  populateSelect("season", options.seasons);
  updateVarieties();
  updateDistricts();
}

function populateSelect(elementId, items) {
  const select = document.getElementById(elementId);
  if (!select) return; 
  
  const currentValue = select.value;
  select.innerHTML = `<option value="">-- Select --</option>`;
  
  const currentLang = state.lang || "en";
  const translations = optionTranslations[currentLang] || {};

  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item; 
    option.textContent = translations[item] || item; 
    select.appendChild(option);
  });
  
  if (items.includes(currentValue)) {
    select.value = currentValue;
  }
}

applyLanguage();
loadOptions().catch(error => {
});