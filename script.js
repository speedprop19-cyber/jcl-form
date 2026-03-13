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
        "Step 1: Basic Information",
        "Step 2: Contact Details",
        "Step 3: Emergency Contacts",
        "Step 4: Employment Details",
        "Step 5: Product Selection",
        "Step 6: Confirmation"
    ];

    function updateForm() {
        // Show current step and hide others
        steps.forEach((step, idx) => {
            step.classList.toggle('active', (idx + 1) === currentStep);
        });

        // Update progress bar
        const progress = (currentStep / steps.length) * 100;
        progressBar.style.width = `${progress}%`;

        // Update step labels
        stepLabels.forEach((label, idx) => {
            label.classList.toggle('active', (idx + 1) <= currentStep);
        });

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
    }

    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
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

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('invalid');
                valid = false;
            } else {
                input.classList.remove('invalid');
            }
        });

        if (!valid) {
            alert("Please fill in all required fields.");
        }
        return valid;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Replace with your Google Apps Script Web App URL
        const scriptURL = 'https://script.google.com/macros/s/AKfycbyuK0c4nQjOZKiyWjVA9x8YdtHF4DKJdzHFfybbS-XO3MNjyg2DFcbhphJPEYughJsF/exec';

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            // For now, we simulate success if no URL is provided
            if (scriptURL === 'https://script.google.com/macros/s/AKfycbyuK0c4nQjOZKiyWjVA9x8YdtHF4DKJdzHFfybbS-XO3MNjyg2DFcbhphJPEYughJsF/exec') {
                console.log("Data captured:", data);
                setTimeout(() => {
                    successModal.style.display = 'flex';
                }, 1000);
            } else {
                const response = await fetch(scriptURL, {
                    method: 'POST',
                    mode: 'no-cors', // Apps Script often requires no-cors for simple posts
                    cache: 'no-cache',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                successModal.style.display = 'flex';
            }
        } catch (error) {
            console.error('Submission Error:', error);
            alert("An error occurred during submission. Please try again.");
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
        }
    });
});
