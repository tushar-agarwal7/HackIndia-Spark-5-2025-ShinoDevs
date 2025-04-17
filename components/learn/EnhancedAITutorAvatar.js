"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { motion } from 'framer-motion';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function EnhancedAITutorAvatar({ 
  isActive = false, 
  isSpeaking = false,
  languageCode = 'en',
  avatarType = 'humanoid',
  audioAnalysis = null,
  className = ""
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const avatarRef = useRef(null);
  const composerRef = useRef(null);
  const volumeRef = useRef(0);
  const timeRef = useRef(0);
  const animationMixerRef = useRef(null);
  const faceBonesRef = useRef({});
  const blinkTimerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const webGLContextRef = useRef(null);
  
  // Language color mapping with vibrant, culturally relevant colors
  const languageColors = useMemo(() => ({
    en: new THREE.Color(0x3b82f6), // English - Royal Blue
    es: new THREE.Color(0xef4444), // Spanish - Vibrant Red (flamenco)
    fr: new THREE.Color(0x0ea5e9), // French - Sky Blue (flag color)
    de: new THREE.Color(0x65a30d), // German - Forest Green
    ja: new THREE.Color(0xec4899), // Japanese - Cherry Blossom Pink
    zh: new THREE.Color(0xf59e0b), // Chinese - Imperial Gold
    ko: new THREE.Color(0x4f46e5), // Korean - Deep Indigo
    ru: new THREE.Color(0xbe123c), // Russian - Deep Red
    ar: new THREE.Color(0x16a34a), // Arabic - Emerald Green
    it: new THREE.Color(0x22c55e), // Italian - Verde (green)
    pt: new THREE.Color(0x84cc16), // Portuguese - Lime Green
    hi: new THREE.Color(0xf97316)  // Hindi - Deep Saffron (from flag)
  }), []);
  
  // Avatar model paths
  const avatarModels = useMemo(() => ({
    humanoid: '/models/humanoid_tutor.glb',
    robot: '/models/robot_tutor.glb',
    animal: '/models/animal_tutor.glb'
  }), []);

  // Get primary color for avatar based on language
  const getPrimaryColor = () => {
    return languageColors[languageCode] || languageColors.en;
  };
  
  // Get secondary color for avatar highlights
  const getSecondaryColor = () => {
    const primaryColor = getPrimaryColor();
    const hsl = {};
    primaryColor.getHSL(hsl);
    // Create complementary color with slight shift
    hsl.h = (hsl.h + 0.45) % 1;
    hsl.s = Math.min(hsl.s + 0.1, 1.0);
    hsl.l = Math.min(hsl.l + 0.15, 0.8);
    const secondaryColor = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
    return secondaryColor;
  };
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
      // Setup scene
      const scene = new THREE.Scene();
      
      // Create a gradient background
      const primaryColor = getPrimaryColor();
      const hsl = {};
      primaryColor.getHSL(hsl);
      
      // Create subtle gradient using two colors
      const topColor = new THREE.Color().setHSL(hsl.h, hsl.s * 0.2, 0.2);
      const bottomColor = new THREE.Color().setHSL(hsl.h, hsl.s * 0.3, 0.1);
      
      // Set background as vertex colors on a plane
      const bgGeometry = new THREE.PlaneGeometry(2, 2);
      const bgMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 colorTop;
          uniform vec3 colorBottom;
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(mix(colorBottom, colorTop, vUv.y), 1.0);
          }
        `,
        uniforms: {
          colorTop: { value: topColor },
          colorBottom: { value: bottomColor }
        },
        depthWrite: false
      });
      
      const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
      bgMesh.renderOrder = -1000;
      scene.add(bgMesh);
      
      sceneRef.current = scene;
      
      // Setup camera
      const camera = new THREE.PerspectiveCamera(
        45, 
        containerRef.current.clientWidth / containerRef.current.clientHeight, 
        0.1, 
        1000
      );
      camera.position.set(0, 1.6, 4);
      cameraRef.current = camera;
      
      // Setup renderer with high quality settings
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(
        containerRef.current.clientWidth, 
        containerRef.current.clientHeight
      );
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.outputEncoding = THREE.CustomBlending;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
      
      // Add renderer to DOM
      containerRef.current.appendChild(renderer.domElement);
      
      // Setup post-processing
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);
      
      // Add bloom effect for glow
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(
          containerRef.current.clientWidth, 
          containerRef.current.clientHeight
        ),
        0.4,  // strength - more subtle
        0.5,  // radius - wide glow
        0.85  // threshold - only brightest parts glow
      );
      composer.addPass(bloomPass);
      
      // Add anti-aliasing
      const fxaaPass = new ShaderPass(FXAAShader);
      fxaaPass.material.uniforms['resolution'].value.set(
        1 / containerRef.current.clientWidth, 
        1 / containerRef.current.clientHeight
      );
      composer.addPass(fxaaPass);
      
      composerRef.current = composer;
      
      // Add atmospheric lighting
      setupLighting(scene);
      
      // Add controls (optional debugging)
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.5;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.5;
      controls.enabled = false; // Disable for production, enable for debugging
      controlsRef.current = controls;
      
      // Load the appropriate avatar model
      loadAvatar(avatarType);
      
      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        
        timeRef.current += 0.016;
        const time = timeRef.current;
        
        // Update controls if enabled
        if (controlsRef.current && controlsRef.current.enabled) {
          controlsRef.current.update();
        }
        
        // Update animation mixer if available
        if (animationMixerRef.current) {
          animationMixerRef.current.update(0.016);
        }
        
        // Update avatar animations
        if (avatarRef.current) {
          // Subtle floating animation 
          if (!animationMixerRef.current) {
            avatarRef.current.position.y = Math.sin(time * 0.8) * 0.05;
          }
          
          // Automatic gentle rotation if controls are disabled
          if (!controlsRef.current.enabled) {
            avatarRef.current.rotation.y = Math.sin(time * 0.5) * 0.15 + Math.PI;
          }
          
          // Update speaking animations
          if (isSpeaking) {
            updateSpeakingAnimation(time);
          }
          
          // Update emissive intensity based on state
          updateEmissiveIntensity();
        }
        
        // Render with composer for post-processing effects
        composerRef.current.render();
      };
      
      animate();
      
      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current || !composerRef.current) return;
        
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        rendererRef.current.setSize(width, height);
        composerRef.current.setSize(width, height);
        
        // Update FXAA resolution
        const passes = composerRef.current.passes;
        const fxaaPass = passes.find(pass => pass.fsQuad && pass.material && pass.material.uniforms.resolution);
        if (fxaaPass) {
          fxaaPass.material.uniforms.resolution.value.set(1 / width, 1 / height);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (containerRef.current && rendererRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        
        if (blinkTimerRef.current) {
          clearInterval(blinkTimerRef.current);
        }
        
        // Dispose of Three.js resources
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
        
        if (controlsRef.current) {
          controlsRef.current.dispose();
        }
        
        if (composerRef.current) {
          composerRef.current.dispose();
        }
        
        // Dispose of geometries and materials
        if (sceneRef.current) {
          sceneRef.current.traverse((object) => {
            if (object.geometry) {
              object.geometry.dispose();
            }
            
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
        }
      };
    } catch (err) {
      console.error('Error initializing 3D avatar:', err);
      setError(err.message);
    }
  }, []);
  
  // Setup lighting system
  const setupLighting = (scene) => {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Main key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(1, 2, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);
    
    // Fill light - opposite of key light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-1, 1, -2);
    scene.add(fillLight);
    
    // Rim light for character silhouette
    const rimLight = new THREE.PointLight(getSecondaryColor(), 1.5, 10);
    rimLight.position.set(-2, 1, -3);
    scene.add(rimLight);
    
    // Ground plane with shadow
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({ 
      opacity: 0.3,
      transparent: true 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    ground.receiveShadow = true;
    scene.add(ground);
  };
  
  // Load avatar model
const loadAvatar = (type) => {
  if (!sceneRef.current) return;
  
  // Remove previous avatar if it exists
  if (avatarRef.current) {
    sceneRef.current.remove(avatarRef.current);
    avatarRef.current = null;
  }
  
  // Reset animation mixer
  if (animationMixerRef.current) {
    animationMixerRef.current = null;
  }
  
  // Skip trying to load external models and always create procedural avatars
  createProceduralAvatar(type);
};
  
  // Setup blinking animation
  const setupBlinking = () => {
    // Clear any existing interval
    if (blinkTimerRef.current) {
      clearInterval(blinkTimerRef.current);
    }
    
    // Set up random blinking
    blinkTimerRef.current = setInterval(() => {
      if (!isSpeaking) {
        // Find eye bones/meshes
        const leftEye = faceBonesRef.current['leftEye'] || faceBonesRef.current['eye_L'];
        const rightEye = faceBonesRef.current['rightEye'] || faceBonesRef.current['eye_R'];
        
        if (leftEye || rightEye) {
          // Blink animation
          const blink = async () => {
            // Close eyes
            if (leftEye) leftEye.scale.y = 0.1;
            if (rightEye) rightEye.scale.y = 0.1;
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Open eyes
            if (leftEye) leftEye.scale.y = 1;
            if (rightEye) rightEye.scale.y = 1;
          };
          
          blink();
        }
      }
    }, 3000 + Math.random() * 4000); // Random blinking interval
  };
  
  // Create procedural avatar as fallback
  const createProceduralAvatar = (type) => {
    const primaryColor = getPrimaryColor();
    const secondaryColor = getSecondaryColor();
    
    const avatar = new THREE.Group();
    
    // Different avatar types with sophisticated geometries
    if (type === 'humanoid') {
      createProceduralHumanoid(avatar, primaryColor, secondaryColor);
    } else if (type === 'animal') {
      createProceduralAnimal(avatar, primaryColor, secondaryColor);
    } else {
      // Default to robot
      createProceduralRobot(avatar, primaryColor, secondaryColor);
    }
    
    // Add to scene
    sceneRef.current.add(avatar);
    avatarRef.current = avatar;
    
    // Position camera to look at avatar
    cameraRef.current.lookAt(avatar.position);
    
    setIsLoaded(true);
  };
  
  // Create procedural robot avatar
  const createProceduralRobot = (avatar, primaryColor, secondaryColor) => {
    // Head
    const headGroup = new THREE.Group();
    
    // Head core - more sophisticated with beveled edges
    const headGeometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const headEdges = new THREE.EdgesGeometry(headGeometry);
    const headLine = new THREE.LineSegments(
      headEdges,
      new THREE.LineBasicMaterial({ color: secondaryColor, linewidth: 2 })
    );
    
    const headMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.8,
      roughness: 0.2,
      emissive: primaryColor,
      emissiveIntensity: 0.2
    });
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    
    headGroup.add(headMesh);
    headGroup.add(headLine);
    
    // Create a visor with curved geometry
    const visorShape = new THREE.Shape();
    visorShape.moveTo(-0.7, -0.1);
    visorShape.lineTo(0.7, -0.1);
    visorShape.lineTo(0.6, 0.2);
    visorShape.lineTo(-0.6, 0.2);
    visorShape.lineTo(-0.7, -0.1);
    
    const visorGeometry = new THREE.ExtrudeGeometry(visorShape, {
      steps: 1,
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelOffset: 0,
      bevelSegments: 3
    });
    
    const visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.9,
      roughness: 0.1,
      emissive: secondaryColor,
      emissiveIntensity: 0.3
    });
    
    const visor = new THREE.Mesh(visorGeometry, visorMaterial);
    visor.position.set(0, 0.2, 0.5);
    visor.rotation.x = Math.PI / 2;
    headGroup.add(visor);
    
    // Eyes (behind visor)
    const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      emissive: secondaryColor,
      emissiveIntensity: 0.8
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.2, 0.7);
    leftEye.scale.z = 0.6;
    headGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.2, 0.7);
    rightEye.scale.z = 0.6;
    headGroup.add(rightEye);
    
    // Add detailed antennas
    const antennaGroup = new THREE.Group();
    
    // Create a more detailed antenna
    const createAntenna = (x) => {
      const baseGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.2, 8);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.1;
      
      const rodGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.5, 8);
      const rod = new THREE.Mesh(rodGeometry, baseMaterial);
      rod.position.y = 0.45;
      
      const tipGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const tipMaterial = new THREE.MeshStandardMaterial({
        color: secondaryColor,
        emissive: secondaryColor,
        emissiveIntensity: 0.8
      });
      const tip = new THREE.Mesh(tipGeometry, tipMaterial);
      tip.position.y = 0.7;
      
      const antenna = new THREE.Group();
      antenna.add(base);
      antenna.add(rod);
      antenna.add(tip);
      antenna.position.set(x, 0.7, 0);
      
      return { group: antenna, tip };
    };
    
    const leftAntenna = createAntenna(-0.5);
    const rightAntenna = createAntenna(0.5);
    
    antennaGroup.add(leftAntenna.group);
    antennaGroup.add(rightAntenna.group);
    headGroup.add(antennaGroup);
    
    // Create body with more details
    const bodyGroup = new THREE.Group();
    
    // Neck with joints
    const neckGroup = new THREE.Group();
    
    const neckJointGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const neckJointMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.3
    });
    const neckJoint = new THREE.Mesh(neckJointGeometry, neckJointMaterial);
    neckJoint.position.y = -0.7;
    neckGroup.add(neckJoint);
    
    const neckGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.3, 16);
    const neckMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.y = -0.85;
    neckGroup.add(neck);
    
    // Torso with armor plates
    const torsoGeometry = new THREE.BoxGeometry(1.6, 1.8, 1);
    const torsoMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.7,
      roughness: 0.3
    });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(0, -1.8, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    bodyGroup.add(torso);
    
    // Add armor plates
    const chestPlateGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.2);
    const chestPlateMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.7,
      roughness: 0.3
    });
    const chestPlate = new THREE.Mesh(chestPlateGeometry, chestPlateMaterial);
    chestPlate.position.set(0, -1.4, 0.5);
    bodyGroup.add(chestPlate);
    
    // Chest reactor/light
    const reactorGeometry = new THREE.CircleGeometry(0.25, 32);
    const reactorMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      emissive: secondaryColor,
      emissiveIntensity: 0.8,
      side: THREE.DoubleSide
    });
    const reactor = new THREE.Mesh(reactorGeometry, reactorMaterial);
    reactor.position.set(0, -1.4, 0.61);
    reactor.rotation.x = Math.PI / 2;
    bodyGroup.add(reactor);
    
    // Add shoulder joints and arms
    const createShoulder = (side) => {
      const x = side === 'left' ? -0.9 : 0.9;
      
      // Shoulder joint
      const shoulderGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const shoulderMaterial = new THREE.MeshStandardMaterial({
        color: primaryColor,
        metalness: 0.8,
        roughness: 0.2
      });
      const shoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
      shoulder.position.set(x, -1.2, 0);
      bodyGroup.add(shoulder);
      
      // Upper arm
      const upperArmGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.7, 16);
      const armMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.7,
        roughness: 0.3
      });
      const upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
      upperArm.position.set(x * 1.1, -1.6, 0);
      upperArm.rotation.z = side === 'left' ? 0.3 : -0.3;
      bodyGroup.add(upperArm);
      
      // Elbow joint
      const elbowGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const elbow = new THREE.Mesh(elbowGeometry, shoulderMaterial);
      elbow.position.set(x * 1.25, -2.0, 0);
      bodyGroup.add(elbow);
      
      // Forearm
      const forearmGeometry = new THREE.CylinderGeometry(0.12, 0.13, 0.6, 16);
      const forearm = new THREE.Mesh(forearmGeometry, armMaterial);
      forearm.position.set(x * 1.35, -2.3, 0);
      forearm.rotation.z = side === 'left' ? 0.2 : -0.2;
      bodyGroup.add(forearm);
    };
    
    createShoulder('left');
    createShoulder('right');
    
    // Assemble avatar
    avatar.add(headGroup);
    avatar.add(neckGroup);
    avatar.add(bodyGroup);
    
    // Store references to animated parts for later use
    avatar.userData = {
      eyes: [leftEye, rightEye],
      antennaTips: [leftAntenna.tip, rightAntenna.tip],
      visor: visor,
      reactor: reactor,
      head: headGroup,
      body: bodyGroup,
      neck: neckGroup,
      primaryMaterial: headMaterial,
      secondaryMaterials: [eyeMaterial, tipMaterial, reactorMaterial],
      chestMaterial: chestPlateMaterial
    };
  };
  
  // Create procedural humanoid avatar
  const createProceduralHumanoid = (avatar, primaryColor, secondaryColor) => {
    // Head with more realistic proportions
    const headGroup = new THREE.Group();
    
    // Base head - slightly oval
    const headGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    headGeometry.scale(0.85, 1, 0.9);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0d0c0, // Skin tone
      metalness: 0.1,
      roughness: 0.8,
      emissive: primaryColor,
      emissiveIntensity: 0.05
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    headGroup.add(head);
    
    // Eyes with more detail
    const eyeGroup = new THREE.Group();
    
    const createDetailedEye = (x) => {
      // Eye white
      const eyeWhiteGeometry = new THREE.SphereGeometry(0.12, 16, 16);
      eyeWhiteGeometry.scale(1, 0.7, 0.6);
      const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0
      });
      const eyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
      
      // Iris
      const irisGeometry = new THREE.CircleGeometry(0.06, 32);
      const irisMaterial = new THREE.MeshStandardMaterial({
        color: primaryColor,
        emissive: primaryColor,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide
      });
      const iris = new THREE.Mesh(irisGeometry, irisMaterial);
      iris.position.z = 0.11;
      iris.rotation.y = Math.PI / 2;
      
      // Pupil
      const pupilGeometry = new THREE.CircleGeometry(0.03, 32);
      const pupilMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        side: THREE.DoubleSide
      });
      const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      pupil.position.z = 0.115;
      pupil.rotation.y = Math.PI / 2;
      
      // Assemble eye
      const eye = new THREE.Group();
      eye.add(eyeWhite);
      eye.add(iris);
      eye.add(pupil);
      eye.position.set(x, 0.1, 0.55);
      
      return { group: eye, eyeWhite };
    };
    
    const leftEye = createDetailedEye(-0.22);
    const rightEye = createDetailedEye(0.22);
    
    eyeGroup.add(leftEye.group);
    eyeGroup.add(rightEye.group);
    headGroup.add(eyeGroup);
    
    // Mouth with subtle curve
    const mouthShape = new THREE.Shape();
    mouthShape.moveTo(-0.15, 0);
    mouthShape.quadraticCurveTo(0, 0.05, 0.15, 0);
    
    const mouthGeometry = new THREE.ShapeGeometry(mouthShape);
    const mouthMaterial = new THREE.MeshBasicMaterial({
      color: 0x842a2a,
      side: THREE.DoubleSide
    });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.2, 0.69);
    mouth.rotation.x = -0.1;
    headGroup.add(mouth);
    
    // Hair or tech headset based on language
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.3,
      roughness: 0.8,
      emissive: primaryColor,
      emissiveIntensity: 0.2
    });
    
    const hairGroup = new THREE.Group();
    
    // Create hair/headset based on language
    if (['ja', 'ko', 'zh'].includes(languageCode)) {
      // Asian-style headset with straight lines
      const headsetTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.1, 0.7),
        hairMaterial
      );
      headsetTop.position.y = 0.5;
      hairGroup.add(headsetTop);
      
      const leftEarpiece = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.3, 0.2),
        hairMaterial
      );
      leftEarpiece.position.set(-0.5, 0.2, 0);
      hairGroup.add(leftEarpiece);
      
      const rightEarpiece = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.3, 0.2),
        hairMaterial
      );
      rightEarpiece.position.set(0.5, 0.2, 0);
      hairGroup.add(rightEarpiece);
    } else {
      // Western/European style with curved headset
      const headsetArc = new THREE.TorusGeometry(0.5, 0.06, 16, 32, Math.PI);
      const headset = new THREE.Mesh(headsetArc, hairMaterial);
      headset.rotation.x = Math.PI / 2;
      headset.position.y = 0.3;
      hairGroup.add(headset);
      
      const leftModule = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        hairMaterial
      );
      leftModule.position.set(-0.52, 0.15, 0);
      hairGroup.add(leftModule);
      
      const rightModule = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        hairMaterial
      );
      rightModule.position.set(0.52, 0.15, 0);
      hairGroup.add(rightModule);
    }
    
    headGroup.add(hairGroup);
    
    // Neck with better proportions
    const neckGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 16);
    const neckMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5c6a0, // Skin tone
      metalness: 0.1,
      roughness: 0.8
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.set(0, -0.8, 0);
    
    // Create body
    const bodyGroup = new THREE.Group();
    
    // Torso with more detail
    const torsoGeometry = new THREE.CapsuleGeometry(0.5, 1.2, 8, 16);
    const torsoMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      metalness: 0.3,
      roughness: 0.7
    });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(0, -1.8, 0);
    torso.rotation.x = Math.PI / 2;
    torso.castShadow = true;
    torso.receiveShadow = true;
    bodyGroup.add(torso);
    
    // Add clothing details - shirt collar
    const collarGeometry = new THREE.TorusGeometry(0.25, 0.05, 8, 16, Math.PI);
    const collarMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5
    });
    const collar = new THREE.Mesh(collarGeometry, collarMaterial);
    collar.position.set(0, -1.15, 0.2);
    collar.rotation.x = -Math.PI / 4;
    bodyGroup.add(collar);
    
    // Add emblem on chest
    const emblemGeometry = new THREE.CircleGeometry(0.15, 32);
    const emblemMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      emissive: primaryColor,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide
    });
    const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
    emblem.position.set(0, -1.4, 0.51);
    emblem.rotation.x = Math.PI / 2;
    bodyGroup.add(emblem);
    
    // Add simple arms
    const createArm = (side) => {
      const x = side === 'left' ? -0.5 : 0.5;
      
      // Upper arm
      const upperArmGeometry = new THREE.CapsuleGeometry(0.12, 0.6, 8, 12);
      const armMaterial = new THREE.MeshStandardMaterial({
        color: 0xe5c6a0, // Skin tone
        metalness: 0.1,
        roughness: 0.8
      });
      const upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
      upperArm.position.set(x * 1.1, -1.6, 0);
      upperArm.rotation.z = side === 'left' ? 0.3 : -0.3;
      bodyGroup.add(upperArm);
    };
    
    createArm('left');
    createArm('right');
    
    // Assemble avatar
    avatar.add(headGroup);
    avatar.add(neck);
    avatar.add(bodyGroup);
    
    // Store references to animated parts
    avatar.userData = {
      eyes: [leftEye.eyeWhite, rightEye.eyeWhite],
      mouth: mouth,
      headset: hairGroup,
      emblem: emblem,
      head: headGroup,
      body: bodyGroup,
      primaryMaterial: hairMaterial,
      secondaryMaterials: [emblemMaterial]
    };
  };
  
  // Create procedural animal avatar (fox-like)
  const createProceduralAnimal = (avatar, primaryColor, secondaryColor) => {
    // Head
    const headGroup = new THREE.Group();
    
    // Base head (fox-like)
    const headGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    headGeometry.scale(1.1, 0.8, 1);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.1,
      roughness: 0.9,
      emissive: primaryColor,
      emissiveIntensity: 0.05
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    headGroup.add(head);
    
    // Create snout with better shape
    const snoutGroup = new THREE.Group();
    
    // Main snout part
    const snoutGeometry = new THREE.ConeGeometry(0.4, 0.7, 32);
    const snoutMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.9
    });
    const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.rotation.x = Math.PI / 2;
    snout.position.z = 0.2;
    snoutGroup.add(snout);
    
    // Bottom jaw/chin
    const jawGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.4);
    jawGeometry.translate(0, -0.1, 0.2);
    const jaw = new THREE.Mesh(jawGeometry, snoutMaterial);
    snoutGroup.add(jaw);
    
    // Nose tip
    const noseGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.1,
      roughness: 0.8
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0, 0.6);
    nose.scale.set(1, 0.7, 0.6);
    snoutGroup.add(nose);
    
    snoutGroup.position.set(0, -0.1, 0.5);
    headGroup.add(snoutGroup);
    
    // Eyes with more detail
    const createEye = (x) => {
      const eyeGroup = new THREE.Group();
      
      // Eyeball
      const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1
      });
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eyeGroup.add(eye);
      
      // Iris
      const irisGeometry = new THREE.CircleGeometry(0.06, 32);
      const irisMaterial = new THREE.MeshStandardMaterial({
        color: secondaryColor,
        emissive: secondaryColor,
        emissiveIntensity: 0.7,
        side: THREE.DoubleSide
      });
      const iris = new THREE.Mesh(irisGeometry, irisMaterial);
      iris.position.z = 0.08;
      iris.rotation.y = Math.PI / 2;
      eyeGroup.add(iris);
      
      // Pupil
      const pupilGeometry = new THREE.CircleGeometry(0.03, 32);
      const pupilMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        side: THREE.DoubleSide
      });
      const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      pupil.position.z = 0.085;
      pupil.rotation.y = Math.PI / 2;
      eyeGroup.add(pupil);
      
      eyeGroup.position.set(x, 0.15, 0.6);
      
      return { group: eyeGroup, eyeball: eye };
    };
    
    const leftEye = createEye(-0.25);
    const rightEye = createEye(0.25);
    
    headGroup.add(leftEye.group);
    headGroup.add(rightEye.group);
    
    // Create detailed ears
    const createEar = (side) => {
      const x = side === 'left' ? -0.4 : 0.4;
      const rotZ = side === 'left' ? -Math.PI / 6 : Math.PI / 6;
      
      const earGroup = new THREE.Group();
      
      // Outer ear - triangle shape but with curved sides
      const earShape = new THREE.Shape();
      earShape.moveTo(0, 0);
      earShape.quadraticCurveTo(0.2, 0.25, 0, 0.5);
      earShape.quadraticCurveTo(-0.2, 0.25, 0, 0);
      
      const earGeometry = new THREE.ExtrudeGeometry(earShape, {
        steps: 1,
        depth: 0.05,
        bevelEnabled: false
      });
      
      const earMaterial = new THREE.MeshStandardMaterial({
        color: primaryColor,
        metalness: 0.1,
        roughness: 0.9,
        side: THREE.DoubleSide
      });
      
      const ear = new THREE.Mesh(earGeometry, earMaterial);
      ear.scale.set(0.6, 0.8, 1);
      
      // Inner ear
      const innerEarGeometry = new THREE.ExtrudeGeometry(earShape, {
        steps: 1,
        depth: 0.01,
        bevelEnabled: false
      });
      
      const innerEarMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdddd,
        metalness: 0.1,
        roughness: 0.9,
        side: THREE.DoubleSide
      });
      
      const innerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
      innerEar.position.z = 0.05;
      innerEar.scale.set(0.4, 0.6, 1);
      
      earGroup.add(ear);
      earGroup.add(innerEar);
      
      earGroup.position.set(x, 0.4, -0.1);
      earGroup.rotation.x = -Math.PI / 6;
      earGroup.rotation.z = rotZ;
      
      return { group: earGroup, ear };
    };
    
    const leftEar = createEar('left');
    const rightEar = createEar('right');
    
    headGroup.add(leftEar.group);
    headGroup.add(rightEar.group);
    
    // Tech overlay - headset/collar
    const techGeometry = new THREE.TorusGeometry(0.6, 0.05, 8, 32, Math.PI);
    const techMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      metalness: 0.7,
      roughness: 0.3,
      emissive: secondaryColor,
      emissiveIntensity: 0.4
    });
    const tech = new THREE.Mesh(techGeometry, techMaterial);
    tech.rotation.x = Math.PI / 2;
    tech.position.set(0, 0.2, -0.1);
    headGroup.add(tech);
    
    // Tech ear modules
    const createEarModule = (x) => {
      const moduleGeometry = new THREE.CapsuleGeometry(0.08, 0.1, 8, 8);
      const module = new THREE.Mesh(moduleGeometry, techMaterial);
      module.position.set(x, 0.1, 0);
      headGroup.add(module);
      return module;
    };
    
    const leftModule = createEarModule(-0.6);
    const rightModule = createEarModule(0.6);
    
    // Neck with natural animal shape
    const neckGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 16);
    const neckMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.1,
      roughness: 0.9
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.set(0, -0.6, 0);
    
    // Body with animal characteristics
    const bodyGroup = new THREE.Group();
    
    // Torso - animal shape
    const torsoGeometry = new THREE.CapsuleGeometry(0.4, 1, 8, 16);
    const torsoMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.1,
      roughness: 0.9
    });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(0, -1.6, 0);
    torso.rotation.x = Math.PI / 2;
    torso.castShadow = true;
    torso.receiveShadow = true;
    bodyGroup.add(torso);
    
    // Tech collar/vest
    const vestGeometry = new THREE.CylinderGeometry(0.42, 0.5, 0.3, 16);
    const vestMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      metalness: 0.5,
      roughness: 0.5,
      emissive: secondaryColor,
      emissiveIntensity: 0.2
    });
    const vest = new THREE.Mesh(vestGeometry, vestMaterial);
    vest.position.set(0, -1.3, 0);
    bodyGroup.add(vest);
    
    // Tech chest emblem
    const emblemGeometry = new THREE.CircleGeometry(0.15, 32);
    const emblemMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide
    });
    const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
    emblem.position.set(0, -1.3, 0.42);
    emblem.rotation.x = Math.PI / 2;
    bodyGroup.add(emblem);
    
    // Assemble avatar
    avatar.add(headGroup);
    avatar.add(neck);
    avatar.add(bodyGroup);
    
    // Store references to animated parts
    avatar.userData = {
      eyes: [leftEye.eyeball, rightEye.eyeball],
      ears: [leftEar.ear, rightEar.ear],
      techParts: [tech, leftModule, rightModule],
      emblem: emblem,
      vest: vest,
      head: headGroup,
      body: bodyGroup,
      snout: snoutGroup,
      primaryMaterial: headMaterial,
      secondaryMaterials: [techMaterial, emblemMaterial, vestMaterial]
    };
  };
  
  // Update material colors based on node properties
  const updateMaterialColors = (node) => {
    if (!node.material) return;
    
    const primaryColor = getPrimaryColor();
    const secondaryColor = getSecondaryColor();
    
    // Check node name to determine appropriate color
    const name = node.name.toLowerCase();
    
    if (name.includes('eye') || name.includes('light') || name.includes('glow') || 
        name.includes('emissive') || name.includes('tech')) {
      // Glowing elements get secondary color
      node.material.color = secondaryColor.clone();
      node.material.emissive = secondaryColor.clone();
      node.material.emissiveIntensity = 0.7;
    } 
    else if (name.includes('primary') || name.includes('main') || name.includes('accent') ||
             name.includes('body') || name.includes('armor')) {
      // Primary elements get primary color
      node.material.color = primaryColor.clone();
      
      // Add subtle emissive glow to primary parts
      node.material.emissive = primaryColor.clone();
      node.material.emissiveIntensity = 0.1;
    }
  };
  
  // Update avatar when type changes
  useEffect(() => {
    if (sceneRef.current) {
      loadAvatar(avatarType);
    }
  }, [avatarType]);
  
  // Update avatar colors when language changes
  useEffect(() => {
    if (avatarRef.current && languageCode) {
      updateAvatarColors();
    }
  }, [languageCode]);
  
  // Update avatar colors based on language
  const updateAvatarColors = () => {
    if (!avatarRef.current) return;
    
    const primaryColor = getPrimaryColor();
    const secondaryColor = getSecondaryColor();
    
    if (avatarRef.current.userData) {
      const userData = avatarRef.current.userData;
      
      // Update primary material
      if (userData.primaryMaterial) {
        userData.primaryMaterial.color.set(primaryColor);
        userData.primaryMaterial.emissive.set(primaryColor);
      }
      
      // Update secondary materials
      if (userData.secondaryMaterials) {
        userData.secondaryMaterials.forEach(material => {
          if (material) {
            material.color.set(secondaryColor);
            material.emissive.set(secondaryColor);
          }
        });
      }
      
      // Update all mesh materials to reflect color changes
      avatarRef.current.traverse(node => {
        if (node.isMesh) {
          updateMaterialColors(node);
        }
      });
    }
  };
  
  // Update speaking animation
  const updateSpeakingAnimation = (time) => {
    if (!avatarRef.current) return;
    
    const userData = avatarRef.current.userData;
    
    // Calculate pulse factor based on audio input or time
    let pulseFactor;
    if (audioAnalysis && typeof audioAnalysis.volume === 'number') {
      // Use audio analysis for more accurate lip sync
      volumeRef.current = THREE.MathUtils.lerp(volumeRef.current, audioAnalysis.volume, 0.3);
      pulseFactor = Math.min(volumeRef.current * 2, 1.0);
    } else {
      // Otherwise use sine wave for natural pulsing
      pulseFactor = (Math.sin(time * 8) * 0.5 + 0.5);
    }
    
    // Facial animations
    if (userData.mouth) {
      // Animate mouth for speech
      userData.mouth.scale.set(1, 1 + pulseFactor * 2, 1);
    }
    
    if (userData.snout) {
      // Subtle snout movement for animal avatar
      userData.snout.rotation.x = Math.sin(time * 6) * 0.05;
    }
    
    // Animate glowing elements
    userData.secondaryMaterials?.forEach(material => {
      if (material) {
        material.emissiveIntensity = 0.4 + pulseFactor * 0.6;
      }
    });
    
    // Type-specific animations
    if (avatarType === 'robot') {
      // Animate antenna tips or other robot elements
      if (userData.antennaTips) {
        userData.antennaTips.forEach(tip => {
          tip.scale.set(
            1 + pulseFactor * 0.3,
            1 + pulseFactor * 0.3,
            1 + pulseFactor * 0.3
          );
        });
      }
      
      if (userData.visor) {
        userData.visor.material.emissiveIntensity = 0.3 + pulseFactor * 0.7;
      }
      
      if (userData.reactor) {
        userData.reactor.material.emissiveIntensity = 0.5 + pulseFactor * 0.5;
      }
    } 
    else if (avatarType === 'animal') {
      // Animate ears for animal avatar
      if (userData.ears) {
        userData.ears.forEach((ear, index) => {
          // Left ear and right ear move in sync with speech
          const multiplier = index === 0 ? 1 : -1;
          ear.rotation.z = (Math.PI / 24) * multiplier * Math.sin(time * 8 + index);
        });
      }
      
      if (userData.emblem) {
        userData.emblem.material.emissiveIntensity = 0.5 + pulseFactor * 0.5;
      }
    }
    
    // Subtle natural head movements for all avatar types
    if (userData.head) {
      userData.head.rotation.y = Math.sin(time * 1.5) * 0.1;
      userData.head.rotation.x = Math.sin(time * 2.1) * 0.05;
      userData.head.rotation.z = Math.sin(time * 1.7) * 0.02;
    }
  };
  
  // Update emissive intensity based on active/inactive state
  const updateEmissiveIntensity = () => {
    if (!avatarRef.current) return;
    
    const userData = avatarRef.current.userData;
    const baseIntensity = isActive ? 0.2 : 0.05;
    
    // Update primary material
    if (userData.primaryMaterial) {
      userData.primaryMaterial.emissiveIntensity = baseIntensity;
    }
    
    // Update secondary materials if not speaking
    if (userData.secondaryMaterials && !isSpeaking) {
      const secondaryIntensity = isActive ? 0.5 : 0.2;
      userData.secondaryMaterials.forEach(material => {
        if (material) {
          material.emissiveIntensity = secondaryIntensity;
        }
      });
    }
  };
  
  // Update avatar when active state changes
  useEffect(() => {
    updateEmissiveIntensity();
  }, [isActive]);
  
  return (
    <div className={`relative ${className}`}>
      <motion.div
        ref={containerRef}
        className="w-full aspect-square rounded-xl overflow-hidden shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />
      
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-xl">
          <div className="w-16 h-16 border-4 border-t-transparent border-primary-500 rounded-full animate-spin mb-4" />
          <div className="text-white text-sm">
            Loading avatar... {Math.round(loadingProgress)}%
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-xl border border-red-200">
          <div className="text-center p-4">
            <p className="text-red-500 font-medium">Failed to load avatar</p>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
        <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center">
          <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-400 animate-pulse' : isActive ? 'bg-amber-400' : 'bg-gray-400'} mr-2`}></span>
          {isSpeaking ? 'Speaking' : isActive ? 'Active' : 'Idle'}
        </div>
        
        <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center">
          <span className={`w-2 h-2 rounded-full bg-${languageCode === 'en' ? 'blue' : languageCode === 'es' ? 'red' : languageCode === 'fr' ? 'sky' : 'teal'}-400 mr-2`}></span>
          {getLanguageName(languageCode)}
        </div>
      </div>
    </div>
  );
  
  // Helper function to get language name from code
  function getLanguageName(code) {
    const languages = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
      ru: "Russian",
      pt: "Portuguese",
      ar: "Arabic",
      hi: "Hindi",
    };
    
    return languages[code] || code;
  }
}