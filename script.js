document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('multi-step-form');
    const steps = document.querySelectorAll('.form-step');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    const progressBar = document.getElementById('progress-bar');
    const stepLabels = document.querySelectorAll('.step-label');
    const stepTitle = document.getElementById('step-title');
    const successModal = document.getElementById('success-modal');

    let currentStep = 1;

    const titles = [
        "Applicant Details",   // 1
        "Contact Details",     // 2
        "Emergency Contacts",   // 3
        "Emergency Contacts",   // 4
        "Employment Details",   // 5
        "Product Selection",    // 6
        "Product Information",  // 7
        "Document Upload",      // 8
        "Consent",              // 9
        "Confirmation"          // 10
    ];

    function updateForm() {
        // Show current step and hide others
        steps.forEach((step, idx) => {
            step.classList.toggle('active', (idx + 1) === currentStep);
        });

        // Update progress segments
        const segments = document.querySelectorAll('.progress-segment');
        segments.forEach((seg, idx) => {
            // UI shows 7 segments. Internal steps:
            // 1: Segment 1
            // 2: Segment 2
            // 3: Segment 3
            // 4: Segment 3 (sub)
            // 5: Segment 4
            // 6: Segment 5
            // 7: Segment 6
            // 8: Segment 6 (sub)
            // 9: Segment 7

            let activeSegment = currentStep;
            if (currentStep >= 4) activeSegment = currentStep - 1; // 4->3, 5->4, 6->5, 7->6, 8->7, 9->8??
            // Wait, we have 9 internal steps but 7 segments in screenshot.
            // Let's group:
            // 1 (App) -> 1
            // 2 (Contact) -> 2
            // 3,4 (Emergency) -> 3
            // 5 (Employment) -> 4
            // 6 (Product Sel) -> 5
            // 7,8 (Product Info/Upload) -> 6
            // 9 (Consent) -> 7

            let uiSegment = 1;
            if (currentStep === 1) uiSegment = 1;
            else if (currentStep === 2) uiSegment = 2;
            else if (currentStep === 3 || currentStep === 4) uiSegment = 3;
            else if (currentStep === 5) uiSegment = 4;
            else if (currentStep === 6) uiSegment = 5;
            else if (currentStep === 7 || currentStep === 8) uiSegment = 6;
            else if (currentStep === 9) uiSegment = 7;

            seg.classList.toggle('active', (idx + 1) <= uiSegment);
        });

        // Update step label text
        let displayStep = currentStep;
        if (currentStep === 3 || currentStep === 4) displayStep = 3;
        else if (currentStep === 5) displayStep = 4;
        else if (currentStep === 6) displayStep = 5;
        else if (currentStep === 7 || currentStep === 8) displayStep = 6;
        else if (currentStep === 9) displayStep = 7;

        document.getElementById('step-label-text').textContent = `Step ${displayStep} of 7`;

        // Update title
        stepTitle.textContent = titles[currentStep - 1];

        // Controls visibility
        prevBtn.style.display = currentStep === 1 ? 'none' : 'block';
        if (currentStep === steps.length) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }

        // Refresh clear icons for the newly shown step
        initClearIcons();
        initFileHandlers();
    }

    // Smart NRIC Parsing
    const nricInput = document.getElementById('nric');
    const genderInput = document.getElementById('sex');
    const dobInput = document.getElementById('dob');
    const nameInput = document.getElementById('name');
    const accHolderInput = document.getElementById('acc_holder');

    let accHolderManuallyEdited = false;

    if (accHolderInput) {
        accHolderInput.addEventListener('input', () => {
            accHolderManuallyEdited = true;
        });
    }

    if (nameInput && accHolderInput) {
        nameInput.addEventListener('input', (e) => {
            if (!accHolderManuallyEdited) {
                accHolderInput.value = e.target.value.toUpperCase();
            }
        });
    }

    // Postcode Lookup Logic
    const postcodeInput = document.getElementById('postcode');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');

    const postcodeMap = {
        // PERLIS
        '01000': { city: 'KANGAR', state: 'PERLIS' },
        // KEDAH
        '05000': { city: 'ALOR SETAR', state: 'KEDAH' },
        '08000': { city: 'SUNGAI PETANI', state: 'KEDAH' },
        '09000': { city: 'KULIM', state: 'KEDAH' },
        // PULAU PINANG
        '10000': { city: 'GEORGETOWN', state: 'PULAU PINANG' },
        '11900': { city: 'BAYAN LEPAS', state: 'PULAU PINANG' },
        '13000': { city: 'BUTTERWORTH', state: 'PULAU PINANG' },
        '14000': { city: 'BUKIT MERTAJAM', state: 'PULAU PINANG' },
        // KELANTAN
        '15000': { city: 'KOTA BHARU', state: 'KELANTAN' },
        // TERENGGANU
        '20000': { city: 'KUALA TERENGGANU', state: 'TERENGGANU' },
        // PAHANG
        '25000': { city: 'KUANTAN', state: 'PAHANG' },
        '28000': { city: 'TEMERLOH', state: 'PAHANG' },
        '39000': { city: 'TANAH RATA', state: 'PAHANG' }, // Cameron
        '69000': { city: 'GENTING HIGHLANDS', state: 'PAHANG' },
        // PERAK
        '30000': { city: 'IPOH', state: 'PERAK' },
        '34000': { city: 'TAIPING', state: 'PERAK' },
        // SELANGOR
        '40000': { city: 'SHAH ALAM', state: 'SELANGOR' },
        '41200': { city: 'KLANG', state: 'SELANGOR' },
        '42000': { city: 'PORT KLANG', state: 'SELANGOR' },
        '43000': { city: 'KAJANG', state: 'SELANGOR' },
        '43200': { city: 'CHERAS', state: 'SELANGOR' },
        '43300': { city: 'SERI KEMBANGAN', state: 'SELANGOR' },
        '46000': { city: 'PETALING JAYA', state: 'SELANGOR' },
        '47100': { city: 'PUCHONG', state: 'SELANGOR' },
        '47300': { city: 'PETALING JAYA', state: 'SELANGOR' },
        '47400': { city: 'PETALING JAYA', state: 'SELANGOR' },
        '47500': { city: 'SUBANG JAYA', state: 'SELANGOR' },
        '47600': { city: 'SUBANG JAYA', state: 'SELANGOR' },
        '47800': { city: 'PETALING JAYA', state: 'SELANGOR' },
        '48000': { city: 'RAWANG', state: 'SELANGOR' },
        '63000': { city: 'CYBERJAYA', state: 'SELANGOR' },
        '64000': { city: 'KLIA', state: 'SELANGOR' },
        '68000': { city: 'AMPANG', state: 'SELANGOR' },
        '68100': { city: 'BATU CAVES', state: 'SELANGOR' },
        // KUALA LUMPUR
        '50000': { city: 'KUALA LUMPUR', state: 'W.P. KUALA LUMPUR' },
        '55100': { city: 'KUALA LUMPUR', state: 'W.P. KUALA LUMPUR' },
        '58200': { city: 'KUALA LUMPUR', state: 'W.P. KUALA LUMPUR' },
        '60000': { city: 'KUALA LUMPUR', state: 'W.P. KUALA LUMPUR' },
        // PUTRAJAYA
        '62000': { city: 'PUTRAJAYA', state: 'W.P. PUTRAJAYA' },
        // NEGERI SEMBILAN
        '70000': { city: 'SEREMBAN', state: 'NEGERI SEMBILAN' },
        '71000': { city: 'PORT DICKSON', state: 'NEGERI SEMBILAN' },
        // MELAKA
        '75000': { city: 'MELAKA', state: 'MELAKA' },
        // JOHOR
        '79000': { city: 'ISKANDAR PUTERI', state: 'JOHOR' },
        '80000': { city: 'JOHOR BAHRU', state: 'JOHOR' },
        '81100': { city: 'JOHOR BAHRU', state: 'JOHOR' },
        '81300': { city: 'SKUDAI', state: 'JOHOR' },
        '81700': { city: 'PASIR GUDANG', state: 'JOHOR' },
        '83000': { city: 'BATU PAHAT', state: 'JOHOR' },
        '84000': { city: 'MUAR', state: 'JOHOR' },
        // LABUAN
        '87000': { city: 'LABUAN', state: 'W.P. LABUAN' },
        // SABAH
        '88000': { city: 'KOTA KINABALU', state: 'SABAH' },
        '90000': { city: 'SANDAKAN', state: 'SABAH' },
        '91000': { city: 'TAWAU', state: 'SABAH' },
        // SARAWAK
        '93000': { city: 'KUCHING', state: 'SARAWAK' },
        '96000': { city: 'SIBU', state: 'SARAWAK' },
        '98000': { city: 'MIRI', state: 'SARAWAK' }
    };

    // Generic Postcode Lookup Function
    function setupPostcodeLookup(postcodeId, cityId, stateId) {
        const pInput = document.getElementById(postcodeId);
        const cInput = document.getElementById(cityId);
        const sInput = document.getElementById(stateId);

        if (pInput && cInput && sInput) {
            pInput.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 5) val = val.substring(0, 5);
                e.target.value = val;

                if (val.length === 5) {
                    let city = "";
                    let state = "";

                    if (postcodeMap[val]) {
                        city = postcodeMap[val].city;
                        state = postcodeMap[val].state;
                    } else {
                        const prefix = val.substring(0, 2);
                        const p = parseInt(prefix);

                        // Comprehensive State Range Mapping
                        if (p === 1) state = "PERLIS";
                        else if (p === 2 || (p >= 5 && p <= 9)) state = "KEDAH";
                        else if (p >= 10 && p <= 14) state = "PULAU PINANG";
                        else if (p >= 15 && p <= 18) state = "KELANTAN";
                        else if (p >= 20 && p <= 24) state = "TERENGGANU";
                        else if (p >= 25 && p <= 28) state = "PAHANG";
                        else if (p >= 30 && p <= 36) state = "PERAK";
                        else if (p === 39) state = "PAHANG"; // Cameron Highlands
                        else if (p >= 40 && p <= 48) state = "SELANGOR";
                        else if (p === 49) state = "PAHANG"; // Fraser's Hill
                        else if (p >= 50 && p <= 60) state = "W.P. KUALA LUMPUR";
                        else if (p === 62) state = "W.P. PUTRAJAYA";
                        else if (p >= 63 && p <= 68) state = "SELANGOR";
                        else if (p === 69) state = "PAHANG"; // Genting
                        else if (p >= 70 && p <= 73) state = "NEGERI SEMBILAN";
                        else if (p >= 75 && p <= 78) state = "MELAKA";
                        else if (p >= 79 && p <= 86) state = "JOHOR";
                        else if (p === 87) state = "W.P. LABUAN";
                        else if (p >= 88 && p <= 91) state = "SABAH";
                        else if (p >= 93 && p <= 98) state = "SARAWAK";
                        else state = "MALAYSIA";

                        city = "AREA " + val;
                    }

                    cInput.value = city;
                    sInput.value = state;
                    cInput.classList.remove('invalid');
                    sInput.classList.remove('invalid');
                } else {
                    cInput.value = "";
                    sInput.value = "";
                }
            });
        }
    }

    // Initialize lookups
    setupPostcodeLookup('postcode', 'city', 'state');
    setupPostcodeLookup('emergency_postcode', 'emergency_city', 'emergency_state');
    setupPostcodeLookup('emergency2_postcode', 'emergency2_city', 'emergency2_state');
    setupPostcodeLookup('employment_postcode', 'employment_city', 'employment_state');

    // Auto-uppercase for Emergency Names
    function setupUppercase(id) {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
    }
    setupUppercase('emergency_name');
    setupUppercase('emergency2_name');

    // "Stay with Applicant" Auto-fill Logic
    function setupStayWithApplicant(stayId, prefix) {
        const staySelect = document.getElementById(stayId);
        if (staySelect) {
            staySelect.addEventListener('change', (e) => {
                if (e.target.value === 'YES') {
                    document.getElementById(prefix + 'postcode').value = document.getElementById('postcode').value;
                    document.getElementById(prefix + 'city').value = document.getElementById('city').value;
                    document.getElementById(prefix + 'state').value = document.getElementById('state').value;
                    document.getElementById(prefix + 'address1').value = document.getElementById('address1').value;
                    document.getElementById(prefix + 'address2').value = document.getElementById('address2').value;

                    // Remove invalid styling if it was there
                    [prefix + 'postcode', prefix + 'city', prefix + 'state', prefix + 'address1'].forEach(id => {
                        document.getElementById(id).classList.remove('invalid');
                    });
                }
            });
        }
    }
    setupStayWithApplicant('emergency_stay', 'emergency_');
    setupStayWithApplicant('emergency2_stay', 'emergency2_');

    if (nricInput) {
        nricInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (val.length > 12) val = val.substring(0, 12);
            e.target.value = val;

            if (val.length === 12) {
                // Parse DOB
                let year = val.substring(0, 2);
                let month = val.substring(2, 4);
                let day = val.substring(4, 6);

                const currentYear = new Date().getFullYear() % 100;
                year = parseInt(year) > currentYear ? "19" + year : "20" + year;

                dobInput.value = `${day}/${month}/${year}`;

                // Parse Gender (last digit odd = male, even = female)
                const lastDigit = parseInt(val.charAt(11));
                genderInput.value = (lastDigit % 2 === 0) ? "FEMALE" : "MALE";
            } else {
                dobInput.value = "";
                genderInput.value = "";
            }
        });
    }

    // Clear input icons
    function initClearIcons() {
        document.querySelectorAll('.input-container').forEach(container => {
            const icon = container.querySelector('.input-icon');
            const input = container.querySelector('input');
            if (icon && input && icon.textContent === '✕') {
                icon.style.pointerEvents = 'auto';
                icon.style.cursor = 'pointer';
                // Remove existing to avoid duplicates
                const newIcon = icon.cloneNode(true);
                icon.parentNode.replaceChild(newIcon, icon);

                newIcon.addEventListener('click', () => {
                    input.value = '';
                    input.focus();
                    input.dispatchEvent(new Event('input'));
                });
            }
        });
    }

    initClearIcons();

    // Modal Close
    document.getElementById('close-modal')?.addEventListener('click', () => {
        location.reload();
    });

    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            if (currentStep === 6) {
                // Carry over price to calculation page
                const price = document.getElementById('product_price').value;
                const calcCashPrice = document.getElementById('calc_total_cash_price');
                if (calcCashPrice) {
                    calcCashPrice.value = price;
                    // Trigger calc immediately if function is defined
                    if (typeof calculateProductInfo === 'function') calculateProductInfo();
                }
            }
            if (currentStep === 7) {
                const cashPrice = parseFloat(document.getElementById('calc_total_cash_price').value) || 0;
                const downPayment = parseFloat(document.getElementById('calc_down_payment').value) || 0;
                const minPercent = cashPrice * 0.1;
                const minAmount = 850;
                const requiredMin = Math.max(minPercent, minAmount);

                if (downPayment < requiredMin) {
                    alert(`Invalid down payment amount.\n\nDown payment must be at least 10% of the total cash price (RM ${minPercent.toFixed(2)}) AND at least RM ${minAmount.toFixed(2)}.\n\nThe minimum acceptable down payment for this item is RM ${requiredMin.toFixed(2)}.`);
                    document.getElementById('calc_down_payment').classList.add('invalid');
                    return;
                } else {
                    document.getElementById('calc_down_payment').classList.remove('invalid');
                }
            }
            currentStep++;
            updateForm();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        updateForm();
    });

    function validateStep(step) {
        const activeStep = document.querySelector(`.form-step[data-step="${step}"]`);
        const inputs = activeStep.querySelectorAll('input[required], select[required]');
        let valid = true;
        let missingFields = [];

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('invalid');
                valid = false;
                missingFields.push(input.id || input.name);
            } else {
                input.classList.remove('invalid');
            }
        });

        if (!valid) {
            console.log("Validation failed for fields:", missingFields);
            alert("Please fill in all required fields. Missing: " + missingFields.join(", "));
        }
        return valid;
    }

    // Dynamic Motor Model Logic
    const brandSelect = document.getElementById('product_brand');
    const modelSelect = document.getElementById('product_model');

    const motorData = {
        "ZONTES": ["155G", "ZT 155-U", "155U1", "ZT350T-D", "ZT350T - E", "350E", "ZT368T-G", "368G", "368E", "368D", "ZT368G"],
        "KAWASAKI": ["EX650-C", "Z300 ABS", "ZX600-R", "Z250 SL", "D TRACKER X", "VERSYS - X 250", "NINJA 250R", "NINJA 250 SL WSBK", "Z250", "Z250 ABS", "KLX 250", "KLE650-C", "NINJA 250 ABS SE", "NINJA 250 SL", "NINJA 300 ABS", "NINJA 650 SE ABS", "ZR800-A", "NINJA 250", "J300 ABS", "Z800", "NINJA 400 ABS SE", "NINJA 650 SE ABS", "BR125-H", "KL110-E", "KLE 650", "KLX150-D", "ER650-E", "ZR900-BA", "KLE650-E", "ZR1000-F", "ZR1000-D", "NINJA KRR ZX150", "Z650 ABS", "ZR800-B", "EX250-L", "ER250-C", "EX250-T", "BR250-E", "Z900 ZR900F", "KLE250-C", "ZX-6R 636 ABS", "KSR PRO", "VERSYS 650 BLACK", "EX650-KA"],
        "ROYAL ALLOY": ["GP 125", "TG 250", "GP 180", "GP250", "TG200", "GP180 YOUTH EDITION", "GP180", "GP125 YOUTH EDITION", "GP125", "GP 250 YOUTH EDITION", "TG2505", "GP 250"],
        "BMW": ["G310GS", "R1200 GS ADVENTURE", "C400X", "F900XR", "G310R"],
        "ZONGSHEN": ["ZS 250GY-3"],
        "MORBIDELLI": ["T250X", "M502N"],
        "GPX": ["GR200RR", "GENTLEMENT", "LEGEND 150 S", "LEGEND 250", "GR200RR SE", "POPZ 110", "DEMON GR150R", "GR200", "GR200B", "DEMON GR200", "LEGEND 150", "LEGEND TWIN 250", "200VT04CSE"],
        "KYMCO": ["NMS400K", "DTX250"],
        "REGAL RAPTOR": ["DD250E-2B"],
        "BENDA": ["NAPOLEON BOB 500", "CHINCHILLA 500", "NAPOLEON BOB 250", "CHINCHILLA500", "LFC700 PRO", "DARK FLAG 500"],
        "ARIIC": ["318GT"],
        "AFAZ": ["KENCANA 115"],
        "KTM": ["390 ADVENTURE", "DUKE 200 ABS", "DUKE 390 ABS", "RC 200 ABS", "DUKE 250 ABS", "DUKE 200 STD", "DUKE 390 (938)", "RC 390", "690 DUKE R - CKD", "RC250", "250 ADVENTURE", "450 EXC-F", "250 EXC SIX DAYS", "RC 200(S) STD", "RC 390(ABS)", "250 DUKE  (937)"],
        "KTNS": ["RA 2", "RHINO", "CF MOTO 250SR SE", "CF MOTO 250NK SE", "CLASSIC 125GP", "MT07 689CC", "CFMOTO 250SR", "KTNS CFMOTO 250NK"],
        "APRILIA": ["SHIVER 750", "SR GT 200 REPLICA", "SR GT 200 SPORT", "SR GT 200 STD"],
        "YADEA": ["E8S PRO"],
        "KAMAX": ["SUPER PRO 125"],
        "MOMOS": ["DD250E-2B", "DAYTONA 250"],
        "PIAGGIO": ["VESPA SPRINT 150 JUSTIN BIEBER", "VESPA SPRINT 150 OFFICINA 8", "VESPA GTV 300 OFFICINA 8"],
        "HONDA": [
            "VARIO 150 (SELF/DISC/CAST) - ACB150CBT/ ACB150CBTK/M",
            "VARIO 150 REPSOL (SELF/DISC/CAST) - ACB150CBT3/ ACB150CBTK3/M3",
            "WAVE 125I (SELF/2DISC/CAST) AFS125MCRH/M",
            "VARIO 160 SE",
            "ADV 150A/ADV150A2 (SELF/2DISC/CAST)",
            "CBR150R",
            "RS150R",
            "RS150R REPSOL",
            "BEAT   ACH110CBFH/FJ/FL/FN",
            "VARIO 160",
            "CBR150R REPSOL",
            "DASH 125I R",
            "CBR250RR",
            "EX5",
            "WAVE 125I (SELF/DISC/CAST) AFS125MCSH/K",
            "WAVE ALPHA (SELF/DISC/CAST) AFS110MCSG/H/J/L",
            "WAVE ALPHA (SELF/DRUM/SPOKE)AFS110MDG/H/J/L",
            "RS-X FS150FA3/FS150FAN3 REPSOL",
            "DASH 125",
            "PCX WW150 2",
            "CB650F",
            "CBR650F",
            "FORZA 250",
            "ADV160 / ADV160A",
            "WAVE ALPHA AFS110MCSG/H/J/L",
            "EX5 110 FI",
            "FS150FJ 2",
            "VARIO 125 ACB125CBT",
            "WAVE ALPHA AFS110MCS",
            "WAVE DASH FI AFP110CSFG/H",
            "ALFA FI",
            "REBEL CMX500A ABS",
            "VARIO 160 (ACB160CATN2)",
            "WAVE DASH FI AFP110CRFG2/H2",
            "RS-X (FS150FAP)/(FS150FAP2)",
            "CB 250 R",
            "CB500X",
            "RS150R FS150FL2",
            "FS150FJ",
            "WAVE DASH FI AFP110CRFG/H",
            "WAVE ALPHA (SELF/DISC/CAST) AFS110MCSG/H/J/L/N)",
            "FS150FH2",
            "CBR150RA9",
            "DASH 110",
            "VARIO 160 REPSOL (ACB160CATN3)",
            "NSS250A",
            "BEAT ACH110CBFH/FJ/FL/FN/FR",
            "CBR 650 RA",
            "CRF250LRA",
            "RS150R FS150F4",
            "VARIO 160 REPSOL",
            "VARIO 160 (ACB160CATN)",
            "RS150R FS150FL",
            "VARIO 160 ACB160CBT",
            "VARIO 160 ACB160CAT2",
            "RS150R FS150FL3",
            "CB500FE",
            "NBC110MDFH",
            "CBF250NA",
            "DASH 125 AFP125CRF",
            "VARIO 160 ACB160CAT",
            "ADV160 ABS",
            "FS150FA4",
            "CBR500RE",
            "VARIO 160 STD",
            "ADV160 SE",
            "VARIO 160 ACB160CATS2",
            "FORZA250",
            "ADV160A3",
            "ADV 160 STD",
            "CBR150R CBR150RA",
            "FS150FH3",
            "BEAT 110 ACH110CBFS",
            "RS-X WINNER",
            "CBR150RAS/RAS4",
            "VARIO 160 ABS ACB160CATN",
            "VARIO 160 ABS ACB160CATS",
            "VARIO 160 ACB160CATS",
            "ADV350",
            "CBR150",
            "CB250",
            "VARIO 160 ABS ACB160CATN2",
            "CBR 150 WITH ABS",
            "VARIO 160 ABS ACB160CATN3",
            "VARIO 160 ABS ACB160CATS2",
            "ADV750L",
            "WAVE ALPHA AFS110MCS2",
            "ADV160 ADV160A ABS",
            "ADV160AP",
            "BEAT ACH110CBFH",
            "BEAT ACH110CBFN",
            "DASH 125 (CAST)",
            "RS150R TRICO",
            "FS150FL3",
            "FS150FAP",
            "AFS110MCSG/H/J/L/N/S",
            "VARIO 160 ACB160CAT (SELF/CAST/ABS)",
            "ACB160CATN2",
            "RS-X FS150FA2",
            "RS-X FS150FA4",
            "CBR150R SE (CBR150RA8)",
            "CBR 150RA4",
            "BEAT ACH110CBF",
            "RS-X 150 FS150FAP3",
            "RS-X FS150FA3",
            "ADV 160AS",
            "BEAT ACH110CBFJ",
            "BEAT ACH110CBFS",
            "CBR150RAS4",
            "DASH 125 (2DIS)",
            "AFP125CRFK/L/N/S",
            "FS150F4",
            "FS150FAR",
            "WAVE ALPHA (DISK)",
            "RS-X FS150FA",
            "CBR 150 SE",
            "BEAT ACH110CBFR",
            "FS150FAP2",
            "RS-X FS150FA3 ABS (REPSOL EDITION)",
            "WAVE ALPHA (CAST)",
            "VARIO 160 ACB160CAT (CAST)",
            "ACB160CATN",
            "VARIO 160 REPSOL REPSOL EDITION ACB160CATS",
            "NSS300A",
            "RS-X FS150FA",
            "RS-X FS150FA2",
            "FS150FAP2",
            "RS150R FS150FN4",
            "CBR 150R",
            "BEAT ACH110CBFL",
            "RS-X FS150FA2 ABS",
            "FS150FAP3",
            "FS150FAP",
            "FS150FAP3",
            "CBR150RA4",
            "DASH 125 (SELF)",
            "FS150FL",
            "FS150N4",
            "RS-X FS150FA ABS",
            "FS150FAN3",
            "WAVE ALPHA (SELF)",
            "VARIO 160 ACB160CAT (ABS)",
            "ACB160CATS2",
            "ACB160CATN3",
            "RSX WINNER LIMITED (RED)  : RS-X FS150FA2 (FS150FAR2)  150",
            "RSX WINNER (CYAN /BLACK /BLUE ): FS150FAP/FAR",
            "CBR150RA/RA9 (CBR150RAS/RAS4)",
            "FS150FJ 3",
            "RS-X FS150FAR",
            "RS-X FS150FAR2",
            "WAVE ALPHA AFS110MCSS",
            "RSX WINNER SE (YELLOW) FAR4",
            "DASH 125 (AFP125CRF/F3)"
        ],
        "YAMAHA": [
            "MT-25 (MTN250-A)", "R25", "MT-25", "XMAX 250", "YZF R25", "MT - 25", "R25-(YZFR25)", "SR400", "TMAX 560", "135LC FI SE", "135LC FI STANDARD", "135LC SPECIAL EDITION", "135LC-AUTO CLUTCH", "EGO AVANTIZ", "EGO GEAR (LNP125)", "EGO SOLARIZ", "FZ150I (NEW DESIGN)/FZ150I (S)", "LAGENDA 115Z (E/EI/UE15)", "LAGENDA 115Z GP EDITION 115CC", "LAGENDA 115ZR/ZRI 115CC", "MT-15 (BHM3)", "MT-15 (MTN-155)", "NMAX - 155CC", "NVX ( GP EDITION ) - 155CC", "NVX ( SG48 ) - 155CC", "NVX ( SG48 ) ABS - 155CC", "NVX DOXOU SPORTS FASHION EDITION", "NVX STANDARD - 155CC", "NVX ABS - 155CC", "Y15ZR - 150CC", "Y15ZR ( GP EDITION )", "Y16ZR", "Y16ZR (DOXOU)", "Y16ZR (WGP)", "YZF-R15 (YZF155)", "YZF-R15 MONSTER", "YZF-R15M", "XJ6 DIVERSION F", "Y125ZR", "YZF R25 GP EDITION", "135LC (FI) 5MRO", "EZ 115", "NVX", "MT-09", "R1", "NOUVO LC", "R25M", "MT09 890CC", "EGO SI", "135LC ES", "Y16ZR ABS", "Y15ZR SE", "MT-07", "NVX (STD)", "EGO LCI", "PG1 115", "135LC", "YZF-R15", "Y16 ABS 6MRO", "Y16ZR 6MRO LIMITED EDITION", "MT-15", "NMAX ABS", "TRACER 9GT", "XMAX (2025)", "Y125", "NVX ABS V3", "TRACER 9 GT", "NMAX 155 ( ABS )", "NMAX", "NVX ABS SP (TURBO)", "NVX (ABS)", "WR250F", "NVX 155 SP", "NVX ABS SP TURBO", "NVX SP", "EGO GEAR PRO"
        ],
        "SUZUKI": [
            "GIXXER 250", "RAIDER R150FI GP SPECIAL EDITION", "GSX-R150 (GSX-R150RFX)", "GSX-S150 (GSX-S150RFX)", "RAIDER R150FI (FU150MFX)", "RAIDER R150FI AS25", "VSTROM 650 XT", "AVENIS 125", "RAIDER EWC-I", "GSX-R1000", "AVENIS 125 ( GP COLOUR )", "GSX-S750", "V-STROM 250 SX", "BURGMAN STREET 125", "GIXXER SF250 (GP COLOUR)", "GIXXER250SF", "VSTROM 800 DE", "RAIDER R150FI (FU150)", "GSX-R150 SE", "VSTROM 250", "RAIDER 150", "VSTROM 800 RE", "FU150", "SV650 (SV650A) (FY25)", "SV650", "BURGMAN 400", "RAIDER FU 150"
        ],
        "MODENAS": [
            "ELEGAN 250 ABS", "DOMINAR D400UG", "CT115S", "KARISMA 125S", "KRISS 110", "KRISS 110 DISC BRAKE", "KRISS MR2", "PULSAR NS160", "PULSAR NS200", "PULSAR NS200 FI ABS", "PULSAR RS200", "DINAMIK 120", "DOMINAR D 250", "ELEGAN 250 EX", "V15", "NINJA 250 OHLINS", "NINJA 250", "NINJA 250 ABS", "Z250", "DOMINAR D400UG TOURING EDITION", "Z250 ER250G", "KRISS 110H DISC BRAKE", "KRISS MR3 (MJ110F-A2MY)", "DOMINAR D400", "VERSYS-X 250", "NINJA ZX250", "KRISS MJ110", "KRISS 110 (EURO 4)  MJ110F-A3MY", "DINAMIK AS120C-A1MY", "DOMINAR-UG DM400", "NINJA EX250Y", "KRISS 110 DISC BRAKE (EURO 4) MJ110H-A3MY", "KARISMA EX 125", "DOMINAR-D400 DM400", "KRISS 125", "NINJA ZX-25R SE (ZX250K)", "KARISMA SN125Z", "ELIT 150S", "DTX250", "KRISS MJ110 E4", "ELEGEN-250 SN250K", "Z15GT"
        ],
        "SYM": [
            "BONUS 110 (SR)", "BONUS 110 (SR) EURO 3", "BONUS 110 SR", "E BONUS 110", "E BONUS 110H", "JET 14 125I", "JET 14 200I", "JET X", "JET X (SE)", "MIO 110", "SPORT RIDER 125I", "SPORT RIDER 125I (N2)", "SPORT RIDER 125I SE", "VF3I 185", "VF3I 185 (N2)", "VF3I 185 LE", "VF3I 185 LE (PRO)", "VF3I 185 SE", "MAXSYM TL 500", "TL500", "JET POWER 125", "HUSKY 150 SE", "HUSKY ADV 150 SE", "HUSKY ADV 150 STD", "TUSCANY 150", "VTS 200", "HUSKY 150 STD", "JET X STD", "VF3I SE", "CRUISYM 250I", "HUSKY 300", "HUSKY ADX 400I (ADXTG 400)", "T2", "MAXSYM 400I", "ADXTG 400", "VF3I 185 LE VFD (PRO)", "NAGA 155", "VFE 185I", "CRUISYM 400I", "VFE", "VFE185I"
        ],
        "BENELLI": [
            "TNT249SE", "PANAREA 125", "TRK251 SE ABS", "IMPERIALE 400", "249S", "TRK251", "TRK251 SE (N1)", "150 S", "150 S (SE)", "R18I", "R18I (SE)", "RFS 150I LE", "RFS 150I SE", "RFS 150I STD", "TNT 135I", "TNT 135I LE", "TNT 135I SE", "VZ 125I", "VZ 125I SE", "TNT 25", "TNT 249S", "TNT 300", "LEONCINO 250", "IMPERIALE 400 SE", "TNT249S", "LEONCINO 250 SE ABS", "TNT249S (BJ250GS-3-SE)", "250SE", "302R", "TRK502 LE", "LEONCINO 500 (BJ500)", "TNT 600 S", "ES125 SE", "ES125 STD", "TNT 600", "TNT25-N", "TRK 502 X (BJ500GS-A3)", "LEONCINO 250 SE (BJ250-A)", "150S (150-31)", "TRK 502 X ABS", "502C (BJ500-6A)", "TRK 251 SE (BJ250-18A)", "VZ125I SE (N1)", "752S (BJ750GS)"
        ],
        "WMOTO": [
            "RT3S (N1)", "XDV 250 PX", "RT3S", "ES250I", "RT3", "XDV250", "V16", "CUB CLASSIC 110", "CUB CLASSIC SE", "ES125 SE", "ES125 STD", "F-15I", "VE1-110E", "VE1-110E (N1)", "VE1-110H (N1)", "VE1-R", "VE1-R N1", "WM110", "EXTREME 150I SE", "EXTREME 150I STD", "SX2 300", "F15", "V16 250", "ES250", "RT2 250", "GEMMA 125", "SM 125I", "EXTREME 150I SE (N1)", "RT1 150CC", "EXTREME 150I (N1)", "ES 125 STD (N1)", "ES250I (N1)", "ES125 STD (N1)", "EZ125I", "CRUISER AMT 125", "BOBBIE 450S", "CRUISER AMT 125 124CC", "TAIGE NEXT 180I", "NEXY 180I", "NEXY+180", "ISLAND 150", "HAWK 200I SCRAMBLER", "XTREME 150I SE (N1)"
        ],
        "KEEWAY": [
            "PATAGONIA 250", "CAFE RACER 152", "K-LIGHT 202", "SIXTIES 250", "PATAGONIAN EAGLE  250 (QJ250-3)", "XDV180 EVO", "XDV180", "CAFE 152(QJ150-6B)", "BX 200I SE", "BX 200I"
        ],
        "SM_SPORT": [
            "110E", "110R", "110E (N1)", "110E (N2)", "110R (N1)", "110R (N2)", "110R (N3)"
        ],
        "BRIXTON": [
            "CAFE RACER 150I", "CLASSIC 150I", "SCRAMBLER 150I", "FELSBERG 150", "CROSSFIRE 150XS", "RAYBURN 150", "BX150 R (BX150R-CRA)", "STORR 500"
        ],
        "AVETA": [
            "RANGER MAX", "RANGER 130MAX", "RANGER 110", "RX110", "SVR180", "V13R", "VS110", "VS110 DISC BRAKE", "DY90", "EURO 3", "VADV 150", "VZR250", "NOVA 160", "VANGUARD 250 SE", "VTM250 LX", "RANGER CUB CROSS", "VANGUARD 250CC", "DY115 SE DISC BRAKE", "VTM250 M", "RANGER CUB CROSS (SE)", "NOVA 125", "DY115 DRUM", "V13R (V2)", "VS115 DISC BRAKE", "RANGER MAX 130 SE", "RANGER MAX V2 SE", "NOVA160 SE", "RANGER MAX EXPLORER SE", "MARVEL 150", "NOVA 160 SE", "BELLAGIO 125", "NOVA 250", "VANGUARD 250 V2", "VANGUARD V2", "DY115 SE", "NOVA 160 LE", "NOVA 250 (LIMITED EDITION) 250", "VIPER 180"
        ],
        "CMC": [
            "DAYTONA CAFE RACER 250", "ITALJET BUCCANEER 250I"
        ],
        "VESPA": [
            "SPRINT 150 TFT ABS", "GTS 300  SUPER SPORT ABS", "SPRINT 150 ABS", "GTS 150 (70TH ANNIVERSARY)", "LXV 150IE", "PRIMAVERA 150 (70TH ANNIVERSARY)", "PRIMAVERA 150 50TH ANNIVERSARY EDITION", "PRIMAVERA 150 75TH ABS", "GTS 150", "LT 150", "LX 150", "PRIMAVERA 150 ABS", "S125", "GTS 300 SUPER TECH ABS", "GTV 300 HPE ABS", "SPRINT S 150", "VESPA SPRINT 150", "SPRINT 150 S FL", "PRIMAVERA 150 S", "SPRINT TECH 150", "SPRINT 150 FL ABS"
        ],
        "MOTO MORINI": [
            "X-CAPE 650", "X-CAPE 650X"
        ],
        "MV AGUSTA": [
            "MV AGUSTA (CODE : B31)"
        ],
        "SCOMADI": [
            "TL125"
        ],
        "TAYO": [
            "ZONTES ZT155-U1"
        ],
        "QJ MOTOR": [
            "SRK 250 RR", "SRV 250", "SRK 250", "SRT 800X", "SRT 800", "SRK 600", "SRK600RC", "FORT350", "SRF 15", "LTR150 (N1)", "LTR 150", "SVT 650 X", "SRV700", "AX200", "AX200S", "AX 200 S", "SRV 250 AMT", "SRK250S", "SRK 250 S", "SRK250R", "SRK 250 R", "SRV 600 V", "ATX 250", "SRK 250 RD", "ATX 250 X", "SRK 450 RR", "AXS200S"
        ],
        "DUCATI": [
            "SCRAMBLER DESERT SLED"
        ],
        "CFMOTO": [
            "800MT", "NK 250 STD", "700 CL-X HERITAGE", "XO PAPIO", "650GT", "650MT", "DAIICHI CF650TR", "250 CL-X", "250NK", "450MT", "250SR", "450CL-C", "450SR", "450NK", "250NK (N1)", "450SR N1", "450MTX N1", "500SR VOOM", "700MT", "800NK", "250NK LITE", "675SR-R", "800MTX", "CF 675R", "250NK (SE)", "675NK", "PAPIO RACER 126", "MT 700", "450 SR N2", "250SR LITE", "PAPIO RACER"
        ],
        "DEMAK": [
            "SKYLINE 200"
        ],
        "LAMBRETTA": [
            "X 250", "X250A", "X300B", "X250B", "X250GP", "X300GT"
        ],
        "VOGE": [
            "FORMICA ROSSA 150", "CU 525", "FR150 FORMICA ROSSA", "DS900X", "SR3"
        ],
        "NAZA": [
            "N5R"
        ],
        "MODA": [
            "SPORTER S 250", "SPORTER S", "SHIFTER 400X (DY350T-6)", "MOCA SL110-MY", "AERO E", "MOCA LT (SL110 A2)"
        ],
        "ROYAL ENFIELD": [
            "CLASSIC 350", "SUPER METEOR 650 BASE", "SUPER METEOR 650 PREMIUM", "SUPER METEOR 650 MID", "INT BEAR 650 BASE", "INT BEAR 650 PREMIUM", "INT BEAR 650 MID", "SHOTGUN MID 650", "BULLET CLASSIC EFI"
        ],
        "ITALJET": [
            "DRAGSTER 200"
        ],
        // All motor brand data integrated
    };

    if (brandSelect && modelSelect) {
        brandSelect.addEventListener('change', () => {
            const brand = brandSelect.value.toUpperCase();
            const models = motorData[brand] || [];

            // Clear current options
            modelSelect.innerHTML = '';

            if (models.length > 0) {
                modelSelect.disabled = false;
                modelSelect.innerHTML = '<option value="">Select Model</option>';
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.toUpperCase();
                    option.textContent = model.toUpperCase();
                    modelSelect.appendChild(option);
                });
            } else {
                modelSelect.disabled = true;
                modelSelect.innerHTML = '<option value="">Select Brand First</option>';
            }
        });
    }

    // Product Information Calculations
    const calcTenure = document.getElementById('calc_tenure');
    const calcDownPayment = document.getElementById('calc_down_payment');
    const calcInterestRate = document.getElementById('calc_interest_rate');
    const calcCashPrice = document.getElementById('calc_total_cash_price');
    const calcFinanceAmount = document.getElementById('calc_finance_amount');
    const calcTotalInterest = document.getElementById('calc_total_interest');
    const calcTotalAmount = document.getElementById('calc_total_amount');
    const calcMonthlyInstalment = document.getElementById('calc_monthly_instalment');

    function calculateProductInfo() {
        if (!calcCashPrice || !calcCashPrice.value) return;

        const cashPrice = parseFloat(calcCashPrice.value) || 0;
        const downPayment = parseFloat(calcDownPayment.value) || 0;
        const interestRate = parseFloat(calcInterestRate.value) || 0;
        const tenure = parseInt(calcTenure.value) || 0;

        const financeAmount = cashPrice - downPayment;
        calcFinanceAmount.value = financeAmount.toFixed(2);

        const totalInterest = (interestRate / 100) * financeAmount;
        calcTotalInterest.value = totalInterest.toFixed(2);

        const totalAmount = financeAmount + totalInterest;
        calcTotalAmount.value = totalAmount.toFixed(2);

        if (tenure > 0) {
            const monthlyInstalment = totalAmount / tenure;
            calcMonthlyInstalment.value = monthlyInstalment.toFixed(2);
        } else {
            calcMonthlyInstalment.value = "";
        }
    }

    [calcTenure, calcDownPayment, calcInterestRate].forEach(el => {
        if (el) el.addEventListener('input', calculateProductInfo);
    });

    function initFileHandlers() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            const infoId = `info_${input.name}`;
            const infoDiv = document.getElementById(infoId);

            if (infoDiv) {
                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        infoDiv.textContent = file.name;
                        infoDiv.classList.add('has-file');
                        input.classList.remove('invalid');
                    } else {
                        infoDiv.textContent = 'No file chosen';
                        infoDiv.classList.remove('has-file');
                    }
                });
            }
        });
    }

    async function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data: prefix
            reader.onerror = error => reject(error);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Process files
        const fileInputs = document.querySelectorAll('input[type="file"]');
        const fileData = {};

        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing Files...';

        for (const input of fileInputs) {
            const file = input.files[0];
            if (file) {
                try {
                    const base64 = await fileToBase64(file);
                    data[`${input.name}_base64`] = base64;
                    data[`${input.name}_name`] = file.name;
                    data[`${input.name}_type`] = file.type;
                } catch (err) {
                    console.error(`Error processing ${input.name}:`, err);
                }
            }
        }

        console.log("Submitting Data to Google Sheet:", data);

        const payload = JSON.stringify(data);
        console.log("Payload Size (approx):", (payload.length / 1024).toFixed(2), "KB");
        console.log("Submitting Data to Google Sheet...");

        // Replace with your Google Apps Script Web App URL
        const scriptURL = 'https://script.google.com/macros/s/AKfycbwPeahLH_6KydFLNG8VT_E6o19omx_KB_nkJjXLJMqlUCVROLWHF39e5Qjut0nWHNvz/exec';

        submitBtn.textContent = 'Submitting...';

        try {
            // Using 'text/plain' as Content-Type for 'no-cors' to avoid preflight blocks
            const response = await fetch(scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'text/plain' },
                body: payload
            });

            console.log("Submission attempt sent. Size:", (payload.length / 1024).toFixed(2), "KB");
            successModal.style.display = 'flex';
        } catch (error) {
            console.error('Submission Error (Network/CORS):', error);
            alert("A network error occurred. Please check your internet or App Script URL.");
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
        }
    });

    // Final Initialization
    updateForm();
});
