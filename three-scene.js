// ==========================================================================
// SIGALAGALA 3D MOBILE-OPTIMIZED HIGH-FIDELITY UNVEILING ENGINE
// ==========================================================================

let scene, camera, renderer, houseModel, revealPlane;

// Auto-inject GLTFLoader to keep pipeline operations seamless
const loaderScript = document.createElement('script');
loaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
document.head.appendChild(loaderScript);

loaderScript.onload = () => {
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', init3DScene);
    } else {
        init3DScene();
    }
};

function init3DScene() {
    const container = document.getElementById('webgl-container');
    if (!container) return;

    scene = new THREE.Scene();
    
    // Set up optimized mobile field-of-view layout metrics
    const isMobile = window.innerWidth < 768;
    
    // Low FOV acts like an isometric lens, keeping structural proportions sharp
    camera = new THREE.PerspectiveCamera(isMobile ? 32 : 25, window.innerWidth / window.innerHeight, 0.1, 1500);
    
    // FIXED/ADJUSTED: Calibrated bird's-eye architectural positioning to prevent bounding box clipping [User Correction Ledger]
    camera.position.set(isMobile ? 24 : 20, isMobile ? 36 : 30, isMobile ? 24 : 20);
    camera.lookAt(0, 4, 0); // Focus slightly upward toward the house core instead of the ground floor grid

    // Dynamic anti-aliasing throttle to prevent high processing dropouts on mobile WebGL contexts
    renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.2 : 1.5)); 
    renderer.localClippingEnabled = true; 
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Studio Lighting Array
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(15, 45, 15); 
    scene.add(dirLight);

    // Deep tech-themed ambient fill light matching the platform's dark UI theme
    const accentLight = new THREE.PointLight(0x7f00ff, 3.0, 40);
    accentLight.position.set(-8, 12, -8);
    scene.add(accentLight);

    // ADJUSTED: Calibrated clipping constant vector to cleanly cross-section the model from the new high camera angle [User Correction Ledger]
    revealPlane = new THREE.Plane(new THREE.Vector3(0, -1, -0.2).normalize(), 55);

    // Async GLTF Loader Mechanism
    const loader = new THREE.GLTFLoader();
    
    loader.load('autumn_house.glb', (gltf) => {
        houseModel = gltf.scene;
        
        // Compute bounding data to auto-center the house geometry on coordinate origin (0,0,0)
        const box = new THREE.Box3().setFromObject(houseModel);
        const center = box.getCenter(new THREE.Vector3());
        
        houseModel.position.x += (houseModel.position.x - center.x);
        houseModel.position.z += (houseModel.position.z - center.z);
        houseModel.position.y += (houseModel.position.y - box.min.y); // Snap house foundation tightly to grid floor ground level

        // Bind revealing shearing planes across all child mesh instances
        houseModel.traverse((node) => {
            if (node.isMesh) {
                node.material.clippingPlanes = [revealPlane];
                node.material.clipShadows = true;
                node.material.side = THREE.DoubleSide;
            }
        });

        scene.add(houseModel);
        hidePreloader();
        animateScene();
    }, 
    (xhr) => {
        if (xhr.total > 0) {
            const pct = (xhr.loaded / xhr.total) * 100;
            const bar = document.querySelector('.progress');
            if (bar) bar.style.width = `${pct}%`;
        }
    },
    (error) => {
        console.warn('Asset model missing or layout corrupted. Rendering fallback wireframe box...', error);
        generateFallbackMatrix();
    });
}

function generateFallbackMatrix() {
    houseModel = new THREE.Group();
    const geo = new THREE.BoxGeometry(6, 5, 6, 10, 10, 10);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0x00f2fe, 
        wireframe: true,
        clippingPlanes: [revealPlane] 
    });
    const fallbackMesh = new THREE.Mesh(geo, mat);
    fallbackMesh.position.y = 2.5; // Elevate fallback cleanly onto ground plane view
    houseModel.add(fallbackMesh);
    scene.add(houseModel);
    hidePreloader();
    animateScene();
}

function animateScene() {
    requestAnimationFrame(animateScene);
    if (houseModel) {
        houseModel.rotation.y += 0.0025; // Balanced rotational sweep speed
    }
    renderer.render(scene, camera);
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader && typeof gsap !== 'undefined') {
        // Leverages your active project-bound GSAP instance for a clean UI fade out transition
        gsap.to(preloader, {
            opacity: 0,
            duration: 0.8,
            onComplete: () => preloader.remove()
        });
    } else if (preloader) {
        // Fallback smooth transition if script assets resolve out of sequence
        preloader.style.transition = 'opacity 0.8s ease';
        preloader.style.opacity = '0';
        setTimeout(() => preloader.remove(), 800);
    }
}

// Fluid responsive viewpoint reflow mapping
window.addEventListener('resize', () => {
    if (!camera || !renderer) return;
    const isMobile = window.innerWidth < 768;
    camera.aspect = window.innerWidth / window.innerHeight;
    
    // Re-synchronize the elevated bird's-eye spatial coordinates seamlessly on frame resize updates
    camera.position.set(isMobile ? 24 : 20, isMobile ? 36 : 30, isMobile ? 24 : 20);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
