// ==========================================================================
// SIGALAGALA MAIN APPLICATION CORE & INTERACTION ENGINE
// ==========================================================================

// Initial default state premium seed listings
const BASE_HOSTELS = [
    {
        id: 17178001,
        name: "Sevenel Luxury Suites",
        location: "Runda",
        distance: "3 mins walk",
        price: 8500,
        contact: "254715340655",
        roomType: "bedsitter",
        amenities: ["wifi", "water", "shower", "token"],
        image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
        doors: [
            { id: "B1", vacant: true },
            { id: "B2", vacant: false },
            { id: "B3", vacant: true },
            { id: "B4", vacant: false },
            { id: "B5", vacant: true }
        ]
    },
    {
        id: 17178002,
        name: "Ikolomani Premium Residency",
        location: "Ikolomani",
        distance: "5 mins walk",
        price: 6000,
        contact: "254715340655",
        roomType: "single",
        amenities: ["wifi", "water", "shower"],
        image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
        doors: [
            { id: "1", vacant: true },
            { id: "2", vacant: true },
            { id: "3", vacant: false },
            { id: "4", vacant: true }
        ]
    },
    {
        id: 17178003,
        name: "The Matrix Heights",
        location: "Behind the school",
        distance: "2 mins walk",
        price: 12000,
        contact: "254715340655",
        roomType: "one-bed",
        amenities: ["wifi", "water", "shower", "token"],
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        doors: [
            { id: "A1", vacant: false },
            { id: "A2", vacant: false }
        ]
    }
];

// Memory Engine State Variables
let hostels = [];
let currentUser = null;
let currentAuthRole = 'tenant'; 
let authMode = 'signup'; 
let currentRoomTypeFilter = 'all';
let temporaryUploadedImageBase64 = "";
let activeSelectedRooms = {}; 
let currentConfigRoomCount = 5;

const MASTER_ACCESS_KEY = "LIL7177L";

// Initialize Application Engine
document.addEventListener("DOMContentLoaded", () => {
    initializePreloader();
    loadPlatformData();
    initializeFilterListeners();
    initializeRoomTypeTabs();
    generateDashboardDoorPicker();
    checkExistingSession();
    renderHostelGrid();
});

function initializePreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;
    
    let progress = 0;
    const progressEl = preloader.querySelector(".progress");
    
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            gsap.to(preloader, {
                opacity: 0,
                duration: 0.6,
                ease: "power2.out",
                onComplete: () => preloader.style.display = "none"
            });
        }
        if (progressEl) progressEl.style.width = `${progress}%`;
    }, 80);
}

function loadPlatformData() {
    const cached = localStorage.getItem("sigalagala_hostels");
    if (cached) {
        try {
            hostels = JSON.parse(cached);
        } catch (e) {
            hostels = [...BASE_HOSTELS];
        }
    } else {
        hostels = [...BASE_HOSTELS];
        savePlatformData();
    }
}

function savePlatformData() {
    localStorage.setItem("sigalagala_hostels", JSON.stringify(hostels));
}

function checkExistingSession() {
    const cachedUser = localStorage.getItem("sigalagala_session");
    if (cachedUser) {
        try {
            currentUser = JSON.parse(cachedUser);
            updateUserInterfaceForSession();
        } catch (e) {
            localStorage.removeItem("sigalagala_session");
        }
    }
}

/* ==========================================================================
   AUTHENTICATION & PANEL MORPH TRANSITIONS
   ========================================================================== */
function openAuthModal(defaultRole = 'tenant') {
    const modal = document.getElementById("auth-modal");
    if (!modal) return;
    
    modal.classList.add("active");
    authMode = 'signup'; 
    setAuthRole(defaultRole);
    
    gsap.fromTo(".modal-card", { scale: 0.85, y: 40, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.4, ease: "power4.out" });
}

function closeAuthModal() {
    gsap.to(".modal-card", { scale: 0.9, y: 20, opacity: 0, duration: 0.25, ease: "power2.in", onComplete: () => {
        const modal = document.getElementById("auth-modal");
        if (modal) modal.classList.remove("active");
        
        document.getElementById("auth-form").reset();
        document.getElementById("landlord-listing-form").reset();
        
        const preview = document.getElementById("image-upload-preview");
        if (preview) {
            preview.style.display = "none";
            preview.style.backgroundImage = "none";
        }
        temporaryUploadedImageBase64 = "";
    }});
}

function toggleAuthMode() {
    const toggleLink = document.getElementById("auth-toggle-text");
    const submitBtn = document.getElementById("auth-submit-btn");
    const roleSelector = document.getElementById("modal-role-selector");
    
    if (authMode === 'signup') {
        authMode = 'login';
        document.getElementById("auth-title").innerText = "Log In";
        document.getElementById("auth-subtitle").innerText = "Access your verified Sigalagala Premium account.";
        toggleLink.innerHTML = `Don't have an account? <span onclick="toggleAuthMode()">Sign Up</span>`;
        submitBtn.innerText = "Log In";
        roleSelector.style.display = "none";
        
        document.getElementById("wrapper-username").style.display = "none";
        document.getElementById("auth-username").removeAttribute("required");
        document.getElementById("wrapper-phone").style.display = "none";
        document.getElementById("auth-phone").removeAttribute("required");
        document.getElementById("wrapper-hostel-name").style.display = "none";
        document.getElementById("auth-hostel-name").removeAttribute("required");
        document.getElementById("wrapper-access-key").style.display = "none";
        document.getElementById("auth-access-key").removeAttribute("required");
        document.getElementById("wrapper-confirm-password").style.display = "none";
        document.getElementById("auth-confirm-password").removeAttribute("required");
        
        document.getElementById("auth-password").setAttribute("placeholder", "Password");
    } else {
        authMode = 'signup';
        toggleLink.innerHTML = `Already have an account? <span onclick="toggleAuthMode()">Log In</span>`;
        submitBtn.innerText = "Continue";
        roleSelector.style.display = "flex";
        setAuthRole(currentAuthRole);
    }
}

function setAuthRole(role) {
    if (authMode === 'login') return;
    
    currentAuthRole = role;
    document.querySelectorAll(".role-btn").forEach(btn => btn.classList.remove("active"));
    
    const targetBtn = document.getElementById(`role-${role}`);
    if (targetBtn) targetBtn.classList.add("active");
    
    const title = document.getElementById("auth-title");
    const usernameField = document.getElementById("wrapper-username");
    const phoneField = document.getElementById("wrapper-phone");
    const hostelField = document.getElementById("wrapper-hostel-name");
    const accessKeyField = document.getElementById("wrapper-access-key");
    const confirmPassField = document.getElementById("wrapper-confirm-password");

    usernameField.style.display = "flex";
    document.getElementById("auth-username").setAttribute("placeholder", "Full Names");
    document.getElementById("auth-username").setAttribute("required", "required");
    
    document.getElementById("auth-password").setAttribute("placeholder", "Create Password");
    confirmPassField.style.display = "flex";
    document.getElementById("auth-confirm-password").setAttribute("required", "required");

    if (role === 'landlord') {
        title.innerText = "Landlord Studio Signup";
        phoneField.style.display = "flex";
        document.getElementById("auth-phone").setAttribute("required", "required");
        hostelField.style.display = "flex";
        document.getElementById("auth-hostel-name").setAttribute("required", "required");
        accessKeyField.style.display = "flex";
        document.getElementById("auth-access-key").setAttribute("required", "required");
    } else {
        title.innerText = "Create Tenant Space";
        phoneField.style.display = "none";
        document.getElementById("auth-phone").removeAttribute("required");
        hostelField.style.display = "none";
        document.getElementById("auth-hostel-name").removeAttribute("required");
        accessKeyField.style.display = "none";
        document.getElementById("auth-access-key").removeAttribute("required");
    }
}

function handleAuthSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    
    if (authMode === 'signup') {
        const username = document.getElementById("auth-username").value;
        const confirmPassword = document.getElementById("auth-confirm-password").value;
        
        if (password !== confirmPassword) {
            alert("Security Error: Passwords do not match.");
            return;
        }
        
        if (currentAuthRole === 'landlord') {
            const phone = document.getElementById("auth-phone").value;
            const hostelName = document.getElementById("auth-hostel-name").value;
            const accessKey = document.getElementById("auth-access-key").value;
            
            if (accessKey !== MASTER_ACCESS_KEY) {
                alert("Unauthorized Entry: Invalid Master Access Key.");
                return;
            }
            
            currentUser = { 
                username, 
                email, 
                phone, 
                hostelName, 
                role: 'landlord' 
            };
        } else {
            currentUser = { username, email, role: 'tenant' };
        }
    } else {
        currentUser = { 
            username: email.split('@')[0], 
            email: email, 
            role: email.includes('landlord') || email.toLowerCase() === 'sevenelartist@gmail.com' ? 'landlord' : 'tenant' 
        };
    }
    
    localStorage.setItem("sigalagala_session", JSON.stringify(currentUser));
    updateUserInterfaceForSession();
    
    if (currentUser.role === 'landlord') {
        morphToView("modal-auth-view", "modal-landlord-dashboard");
        if(currentUser.hostelName) {
            document.getElementById("listing-name").value = currentUser.hostelName;
        }
        if(currentUser.phone) {
            document.getElementById("listing-contact").value = currentUser.phone.replace("+", "");
        }
    } else {
        closeAuthModal();
        renderHostelGrid();
    }
}

function morphToView(hideId, showId) {
    gsap.to(`#${hideId}`, { opacity: 0, x: -20, duration: 0.25, onComplete: () => {
        document.getElementById(hideId).classList.add("hidden-view");
        const showEl = document.getElementById(showId);
        showEl.classList.remove("hidden-view");
        gsap.fromTo(`#${showId}`, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" });
    }});
}

function logoutPlatform() {
    currentUser = null;
    localStorage.removeItem("sigalagala_session");
    
    const container = document.getElementById("nav-user-space");
    if (container) {
        container.innerHTML = `
            <button class="btn btn-secondary" onclick="openAuthModal('landlord')">Landlord Portal</button>
            <button class="btn btn-primary" onclick="openAuthModal('tenant')">Find Room</button>
        `;
    }
    
    document.getElementById("modal-landlord-dashboard").classList.add("hidden-view");
    document.getElementById("modal-auth-view").classList.remove("hidden-view");
    document.getElementById("modal-auth-view").style.opacity = "1";
    document.getElementById("modal-auth-view").style.transform = "none";
    
    activeSelectedRooms = {};
    renderHostelGrid();
}

function updateUserInterfaceForSession() {
    const container = document.getElementById("nav-user-space");
    if (!container) return;
    
    container.innerHTML = `
        <span class="user-badge"><i class="fa-solid fa-user-shield"></i> ${currentUser.username} (${currentUser.role.toUpperCase()})</span>
        ${currentUser.role === 'landlord' ? '<button class="btn btn-secondary" onclick="openLandlordStudioFromNav()">Studio</button>' : ''}
        <button class="btn btn-primary" style="background:#ff3b30; color:#fff;" onclick="logoutPlatform()">Exit</button>
    `;
}

function openLandlordStudioFromNav() {
    openAuthModal('landlord');
    document.getElementById("modal-auth-view").classList.add("hidden-view");
    document.getElementById("modal-landlord-dashboard").classList.remove("hidden-view");
}

/* ==========================================================================
   DYNAMIC FILTERING ENGINE
   ========================================================================== */
function initializeFilterListeners() {
    document.getElementById("hostel-search").addEventListener("input", renderHostelGrid);
    document.getElementById("location-filter").addEventListener("change", renderHostelGrid);
    document.getElementById("hide-occupied-filter").addEventListener("change", renderHostelGrid);
    
    const slider = document.getElementById("price-filter");
    if (slider) {
        slider.addEventListener("input", (e) => {
            document.getElementById("price-val").innerText = `Ksh ${parseInt(e.target.value).toLocaleString()}`;
            renderHostelGrid();
        });
    }
}

function initializeRoomTypeTabs() {
    const container = document.getElementById("room-type-tabs-container");
    if (!container) return;
    
    container.addEventListener("click", (e) => {
        const tab = e.target.closest(".type-tab");
        if (!tab) return;
        
        container.querySelectorAll(".type-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        
        currentRoomTypeFilter = tab.getAttribute("data-type");
        renderHostelGrid();
    });
}

/* ==========================================================================
   GRID INJECTION & INTERACTIVE SELECTION LAYOUT
   ========================================================================== */
function renderHostelGrid() {
    const grid = document.getElementById("hostel-display-grid");
    if (!grid) return;
    
    const searchVal = document.getElementById("hostel-search").value.toLowerCase().trim();
    const locVal = document.getElementById("location-filter").value.toLowerCase().trim();
    const priceVal = parseInt(document.getElementById("price-filter").value) || 12000;
    const hideOccupied = document.getElementById("hide-occupied-filter").checked;
    
    grid.innerHTML = "";
    
    const targetHostels = hostels.filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(searchVal);
        const matchesLoc = (locVal === "all" || locVal === "") || h.location.toLowerCase().includes(locVal);
        const matchesPrice = h.price <= priceVal;
        const matchesType = (currentRoomTypeFilter === "all") || (h.roomType === currentRoomTypeFilter);
        
        const totalVacant = h.doors.filter(d => d.vacant).length;
        const matchesOccupancy = !hideOccupied || (totalVacant > 0);
        
        return matchesSearch && matchesLoc && matchesPrice && matchesType && matchesOccupancy;
    });

    if (targetHostels.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-container" style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem;">
                <h3 class="no-availability-text" style="color: var(--text-muted); font-size: 1.2rem; margin-bottom: 1rem;">
                    <i class="fa-solid fa-building-circle-exclamation" style="margin-right: 8px;"></i> No residences match your current active filters
                </h3>
                <div class="animation-box" style="max-width: 280px; margin: 0 auto; border-radius: 12px; overflow: hidden; opacity: 0.6;">
                    <img src="https://media.giphy.com/media/l41YfykEffZ7QM55m/giphy.gif" alt="No rooms feedback animation" style="width: 100%; height: auto; display: block;" />
                </div>
            </div>
        `;
        return;
    }

    targetHostels.forEach(hostel => {
        const vacantCount = hostel.doors.filter(d => d.vacant).length;
        const isFullyBooked = vacantCount === 0;
        
        const card = document.createElement("div");
        card.className = `hostel-card ${isFullyBooked ? 'fully-booked-card' : ''}`;
        if (isFullyBooked) card.style.opacity = "0.75";
        
        let doorBadgesHTML = "";
        hostel.doors.forEach(door => {
            let statusClass = door.vacant ? "vacant" : "occupied";
            if (activeSelectedRooms[hostel.id] === door.id) statusClass = "selected";
            
            doorBadgesHTML += `
                <span class="door-pill ${statusClass}" onclick="selectDoorNumber(${hostel.id}, '${door.id}', ${door.vacant})">
                    <i class="fa-solid ${door.vacant ? 'fa-door-open' : 'fa-door-closed'}"></i> Room ${door.id}
                </span>
            `;
        });

        // Map short code keys to clean readable amenity layouts
        let amenitiesHTML = "";
        if (hostel.amenities && hostel.amenities.length > 0) {
            hostel.amenities.forEach(amenity => {
                let config = { icon: "fa-circle", label: amenity };
                if (amenity === "wifi") config = { icon: "fa-wifi", label: "Wi-Fi" };
                if (amenity === "water") config = { icon: "fa-droplet", label: "Water" };
                if (amenity === "shower") config = { icon: "fa-temperature-three-quarters", label: "Hot Shower" };
                if (amenity === "token") config = { icon: "fa-bolt", label: "Own Token" };
                
                amenitiesHTML += `<span class="amenity-tag"><i class="fa-solid ${config.icon}"></i> ${config.label}</span>`;
            });
        }

        const selectedRoom = activeSelectedRooms[hostel.id];
        const hasActiveSession = currentUser !== null;
        
        let actionButtonHTML = "";
        if (!hasActiveSession) {
            actionButtonHTML = `<button class="btn btn-primary card-action-btn" onclick="openAuthModal('tenant')" style="width:100%; margin-top:1rem;">Log In to Book Room</button>`;
        } else if (isFullyBooked) {
            actionButtonHTML = `<button class="btn card-action-btn" disabled style="width:100%; margin-top:1rem; background:#222; color:#555; cursor:not-allowed;">Fully Occupied</button>`;
        } else if (!selectedRoom) {
            actionButtonHTML = `<button class="btn card-action-btn" disabled style="width:100%; margin-top:1rem; background:rgba(255,255,255,0.05); color:var(--text-muted); cursor:not-allowed;">Select Room Code Above</button>`;
        } else {
            const dynamicMessage = encodeURIComponent(
                `Hello, I would like to book Room ${selectedRoom} at ${hostel.name} via Sigalagala Premium Platform. My name is ${currentUser.username}. Please send me the payment details.`
            );
            const waLink = `https://wa.me/${hostel.contact}?text=${dynamicMessage}`;
            actionButtonHTML = `
                <a href="${waLink}" target="_blank" class="btn btn-primary card-action-btn check-out-active-btn" style="width:100%; margin-top:1rem; display:flex; align-items:center; justify-content:center; gap:8px; background:#25d366; border-color:#25d366;">
                    <i class="fa-brands fa-whatsapp"></i> Reserve Room ${selectedRoom} Instantly
                </a>
            `;
        }

        const coverPhoto = hostel.image || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";

        card.innerHTML = `
            <div class="card-image-wrapper" style="background-image: url('${coverPhoto}');">
                <span class="card-price-badge">Ksh ${hostel.price.toLocaleString()} <span>/ Sem</span></span>
                <span class="card-type-badge">${hostel.roomType.toUpperCase()}</span>
            </div>
            <div class="card-body-content">
                <div class="card-meta-top">
                    <h4 class="hostel-title-text">${hostel.name}</h4>
                    <p class="hostel-loc-text"><i class="fa-solid fa-location-dot"></i> ${hostel.location} • <span class="distance-span">${hostel.distance}</span></p>
                </div>
                
                <div class="card-amenities-row">
                    ${amenitiesHTML}
                </div>
                
                <div class="card-matrix-title">
                    <span>Allocation Layout Map:</span>
                    <span class="vacant-tally-indicator">${vacantCount} vacant rooms left</span>
                </div>
                
                <div class="card-door-grid">
                    ${doorBadgesHTML}
                </div>
                
                ${actionButtonHTML}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function selectDoorNumber(hostelId, doorId, isVacant) {
    if (!isVacant) {
        alert("This specific room configuration unit is already registered as occupied by another student client node.");
        return;
    }
    
    if (activeSelectedRooms[hostelId] === doorId) {
        delete activeSelectedRooms[hostelId]; 
    } else {
        activeSelectedRooms[hostelId] = doorId; 
    }
    
    renderHostelGrid();
}

/* ==========================================================================
   LANDLORD STUDIO DASHBOARD MODULE CONTROLS
   ========================================================================== */
function adjustRoomCount(delta) {
    let nextCount = currentConfigRoomCount + delta;
    if (nextCount < 1) nextCount = 1;
    if (nextCount > 30) nextCount = 30; // Protect UI grid view caps limits safely
    
    currentConfigRoomCount = nextCount;
    document.getElementById("room-count-display").innerText = currentConfigRoomCount;
    generateDashboardDoorPicker();
}

function generateDashboardDoorPicker() {
    const pickerGrid = document.getElementById("modal-door-picker");
    if (!pickerGrid) return;
    
    const numberingSystem = document.getElementById("listing-numbering-system").value;
    pickerGrid.innerHTML = "";
    
    for (let i = 1; i <= currentConfigRoomCount; i++) {
        let label = i.toString();
        
        if (numberingSystem === 'alpha-numeric-fixed') {
            label = `A${i}`;
        } else if (numberingSystem === 'alpha-numeric-mixed') {
            const wings = ['A', 'B', 'C', 'D', 'E'];
            const wingIndex = Math.floor((i - 1) / 5) % wings.length;
            const num = ((i - 1) % 5) + 1;
            label = `${wings[wingIndex]}${num}`;
        } else if (numberingSystem === 'alpha') {
            label = String.fromCharCode(64 + (i <= 26 ? i : 26)); 
            if (i > 26) label += (i - 26);
        }
        
        const doorSelectWrapper = document.createElement("label");
        doorSelectWrapper.className = "amenity-checkbox-wrapper door-config-checkbox-label";
        doorSelectWrapper.style.padding = "8px";
        doorSelectWrapper.style.display = "flex";
        doorSelectWrapper.style.alignItems = "center";
        doorSelectWrapper.style.gap = "6px";
        doorSelectWrapper.style.background = "rgba(255,255,255,0.03)";
        doorSelectWrapper.style.borderRadius = "8px";
        doorSelectWrapper.style.cursor = "pointer";
        
        doorSelectWrapper.innerHTML = `
            <input type="checkbox" name="studio-vacant-doors" value="${label}" checked>
            <span style="font-size:0.85rem; font-weight:600;"><i class="fa-solid fa-door-open" style="color:var(--accent-glow);"></i> Rm ${label}</span>
        `;
        pickerGrid.appendChild(doorSelectWrapper);
    }
}

function regenerateDoorSelectionGrid() {
    generateDashboardDoorPicker();
}

function previewUploadedFile(event) {
    const input = event.target;
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        temporaryUploadedImageBase64 = e.target.result;
        const previewEl = document.getElementById("image-upload-preview");
        if (previewEl) {
            previewEl.style.display = "block";
            previewEl.style.backgroundImage = `url('${temporaryUploadedImageBase64}')`;
            previewEl.style.backgroundSize = "cover";
            previewEl.style.backgroundPosition = "center";
            previewEl.style.height = "120px";
            previewEl.style.borderRadius = "8px";
            previewEl.style.marginTop = "8px";
        }
    };
    
    reader.readAsDataURL(file);
}

function handleNewListing(event) {
    event.preventDefault();
    
    if (!currentUser || currentUser.role !== 'landlord') {
        alert("Security Assertion Exception: Operation requires valid Landlord Node Session Context.");
        return;
    }
    
    const name = document.getElementById("listing-name").value.trim();
    const location = document.getElementById("listing-location").value.trim();
    const distance = document.getElementById("listing-distance").value.trim();
    const price = parseInt(document.getElementById("listing-price").value);
    const contactInput = document.getElementById("listing-contact").value.trim();
    const roomType = document.getElementById("listing-room-type").value;
    
    // Process contact string format neatly to standard international
    let cleanContact = contactInput.replace(/\+/g, '').replace(/\s+/g, '');
    if (cleanContact.startsWith("0")) {
        cleanContact = "254" + cleanContact.substring(1);
    }
    if (!cleanContact) cleanContact = "254715340655";

    // Gather amenities array tags values
    const amenityCheckboxes = document.querySelectorAll('input[name="amenities"]:checked');
    const amenities = Array.from(amenityCheckboxes).map(cb => cb.value);
    
    // Form complete structural logic tracking layout for total door units array map
    const doorCheckboxes = document.querySelectorAll('input[name="studio-vacant-doors"]');
    if(doorCheckboxes.length === 0) {
        alert("Please set up or configure the active door collection blueprint metrics system matrix before pushing.");
        return;
    }
    
    const doors = Array.from(doorCheckboxes).map(cb => {
        return {
            id: cb.value,
            vacant: cb.checked 
        };
    });

    const generatedId = Date.now() + Math.floor(Math.random() * 1000);
    
    const newHostelObject = {
        id: generatedId,
        name,
        location,
        distance,
        price,
        contact: cleanContact,
        roomType,
        amenities,
        image: temporaryUploadedImageBase64 || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        doors
    };

    hostels.unshift(newHostelObject);
    savePlatformData();
    
    alert(`Success! "${name}" has been mapped onto the active real-time booking pool layer.`);
    
    closeAuthModal();
    renderHostelGrid();
    
    // Smooth navigation viewport tracking shift anchor focus point directly on top grid matrix results 
    setTimeout(() => {
        const gridHeader = document.querySelector('.grid-header');
        if (gridHeader) gridHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
}