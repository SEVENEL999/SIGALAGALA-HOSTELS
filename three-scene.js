 // ==========================================================================
// SIGALAGALA 3D MOBILE-OPTIMIZED HIGH-FIDELITY UNVEILING ENGINE
// ==========================================================================

let scene, camera, renderer, houseModel, revealPlane;

// Auto-inject GLTFLoader to keep pipeline operations seamless
const loaderScript = document.createElement('script');
loaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
document.head.appendChild(loaderScript);

loaderScript.onload = () => {
    if(document.readyState === 'loading') {
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
    // Lowered FOV to 25/30 to act like a telephoto/isometric lens, keeping the model sharp and large while far away
    camera = new THREE.PerspectiveCamera(isMobile ? 32 : 25, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // ADJUSTED: Raised the camera Y-axis slightly higher (Y=36/30) to enhance the architectural perspective
    camera.position.set(isMobile ? 24 : 20, isMobile ? 36 : 30, isMobile ? 24 : 20);
    camera.lookAt(0, 0, 0);

    // Dynamic anti-aliasing throttle to prevent high processing dropouts on Android GPUs
    renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.2 : 1.5)); 
    renderer.localClippingEnabled = true; 
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Studio Lighting Array
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    // ADJUSTED: Slightly raised the directional light to match the new camera altitude
    dirLight.position.set(10, 40, 12); 
    scene.add(dirLight);

    const accentLight = new THREE.PointLight(0x7f00ff, 2.5, 30);
    accentLight.position.set(-5, 15, -5);
    scene.add(accentLight);

    // ADJUSTED: Maintained a strong clipping distance safety margin to accommodate the higher viewpoint
    revealPlane = new THREE.Plane(new THREE.Vector3(0, -1, -0.4).normalize(), 45);

    // Async GLTF Loader Mechanism
    const loader = new THREE.GLTFLoader();
    
    // Fixed: Looking for the file locally within your served project folder root
    loader.load('autumn_house.glb', (gltf) => {
        houseModel = gltf.scene;
        houseModel.position.set(0, -1, 0);

        // Bind the revealing shearing vectors cleanly over all internal structural items
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
        console.warn('Asset model missing. Rendering fallback high-tech wireframe layout...', error);
        generateFallbackMatrix();
    });
}

function generateFallbackMatrix() {
    houseModel = new THREE.Group();
    const geo = new THREE.BoxGeometry(4.5, 3.5, 4.5, 8, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0x00f2fe, 
        wireframe: true,
        clippingPlanes: [revealPlane] 
    });
    const fallbackMesh = new THREE.Mesh(geo, mat);
    houseModel.add(fallbackMesh);
    scene.add(houseModel);
    hidePreloader();
    animateScene();
}

function animateScene() {
    requestAnimationFrame(animateScene);
    if (houseModel) {
        houseModel.rotation.y += 0.0025; // Continuous display rotation pass
    }
    renderer.render(scene, camera);
}

function hidePreloader() {
    const loader = document.getElementById('preloader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 800);
    }
}

// Full orientation reflow check
window.addEventListener('resize', () => {
    if (!camera || !renderer) return;
    const isMobile = window.innerWidth < 768;
    camera.aspect = window.innerWidth / window.innerHeight;
    
    // ADJUSTED: Re-synchronized the new higher elevation values during resize layout reflows
    camera.position.set(isMobile ? 24 : 20, isMobile ? 36 : 30, isMobile ? 24 : 20);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
