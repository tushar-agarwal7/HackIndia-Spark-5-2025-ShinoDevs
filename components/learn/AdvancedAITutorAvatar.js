"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { motion } from 'framer-motion';

export default function AdvancedAITutorAvatar({ 
  isActive = false, 
  isSpeaking = false,
  languageCode = 'en',
  avatarType = 'robot',
  audioAnalysis = null
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  // Language color mapping
  const languageColors = useMemo(() => ({
    en: new THREE.Color(0x2563eb), // Blue
    es: new THREE.Color(0xdc2626), // Red
    fr: new THREE.Color(0x0284c7), // Sky
    de: new THREE.Color(0x4d7c0f), // Green
    ja: new THREE.Color(0xdb2777), // Pink
    zh: new THREE.Color(0xf59e0b), // Amber
    ko: new THREE.Color(0x4338ca), // Indigo
    ru: new THREE.Color(0xbe123c), // Rose
    ar: new THREE.Color(0x059669), // Emerald
    it: new THREE.Color(0x16a34a), // Green
    pt: new THREE.Color(0x65a30d), // Lime
    hi: new THREE.Color(0xf97316)  // Orange
  }), []);

  // Get primary color for avatar based on language
  const getPrimaryColor = () => {
    return languageColors[languageCode] || languageColors.en;
  };
  
  // Get secondary color for avatar highlights
  const getSecondaryColor = () => {
    // Create a slightly different hue for interesting contrast
    const primaryColor = getPrimaryColor();
    const hsl = {};
    primaryColor.getHSL(hsl);
    // Shift hue by 30 degrees
    hsl.h = (hsl.h + 0.083) % 1;
    // Make it brighter for highlights
    hsl.l = Math.min(hsl.l + 0.2, 0.9);
    const secondaryColor = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
    return secondaryColor;
  };
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
      // Setup scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111827);
      sceneRef.current = scene;
      
      // Setup camera
      const camera = new THREE.PerspectiveCamera(
        50, 
        containerRef.current.clientWidth / containerRef.current.clientHeight, 
        0.1, 
        1000
      );
      camera.position.set(0, 0, 4);
      cameraRef.current = camera;
      
      // Setup renderer
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
      renderer.toneMappingExposure = 1.0;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
      
      // Add renderer to DOM
      containerRef.current.appendChild(renderer.domElement);
      
      // Setup post-processing
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);
      
      // Add bloom effect
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(
          containerRef.current.clientWidth, 
          containerRef.current.clientHeight
        ),
        0.5,  // strength
        0.4,  // radius
        0.85  // threshold
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
      
      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 2, 3);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      scene.add(directionalLight);
      
      // Add rim light for dramatic effect
      const rimLight = new THREE.PointLight(getSecondaryColor(), 1, 10);
      rimLight.position.set(-2, 1, -1);
      scene.add(rimLight);
      
      // Add controls (disabled by default for production)
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.5;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = false;
      controls.enabled = false; // Disabled for production, enable for debugging
      controlsRef.current = controls;
      
      // Create avatar based on selected type
      createAvatar(avatarType);
      
      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        
        timeRef.current += 0.016;
        const time = timeRef.current;
        
        // Update controls if enabled
        if (controlsRef.current && controlsRef.current.enabled) {
          controlsRef.current.update();
        }
        
        // Update avatar animations
        if (avatarRef.current) {
          // Floating animation
          avatarRef.current.position.y = Math.sin(time * 1.5) * 0.1;
          
          // Subtle rotation
          if (!controlsRef.current.enabled) {
            avatarRef.current.rotation.y = Math.sin(time * 0.5) * 0.2 + Math.PI;
          }
          
          // Update speaking animations if applicable
          if (isSpeaking) {
            updateSpeakingAnimation();
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
  
  // Create avatar based on selected type
  const createAvatar = (type) => {
    if (!sceneRef.current) return;
    
    // Remove previous avatar if it exists
    if (avatarRef.current) {
      sceneRef.current.remove(avatarRef.current);
    }
    
    const primaryColor = getPrimaryColor();
    const secondaryColor = getSecondaryColor();
    
    switch (type) {
      case 'humanoid':
        createHumanoidAvatar(primaryColor, secondaryColor);
        break;
      case 'animal':
        createAnimalAvatar(primaryColor, secondaryColor);
        break;
      case 'robot':
      default:
        createRobotAvatar(primaryColor, secondaryColor);
        break;
    }
  };
  
  // Update avatar when avatar type changes
  useEffect(() => {
    if (sceneRef.current) {
      createAvatar(avatarType);
    }
  }, [avatarType]);
  
  // Update avatar colors when language changes
  useEffect(() => {
    if (avatarRef.current && languageCode) {
      updateAvatarColors();
    }
  }, [languageCode]);
  
  // Create robot avatar
  const createRobotAvatar = (primaryColor, secondaryColor) => {
    const avatar = new THREE.Group();
    
    // Create head
    const headGroup = new THREE.Group();
    
    // Head core
    const headGeometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
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
    
    // Visor
    const visorGeometry = new THREE.BoxGeometry(1.42, 0.3, 0.8);
    const visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.9,
      roughness: 0.1,
      emissive: secondaryColor,
      emissiveIntensity: 0.3
    });
    const visor = new THREE.Mesh(visorGeometry, visorMaterial);
    visor.position.set(0, 0.2, 0.33);
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
    
    // Antennas
    const antennaGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    leftAntenna.position.set(-0.4, 0.95, 0);
    headGroup.add(leftAntenna);
    
    const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    rightAntenna.position.set(0.4, 0.95, 0);
    headGroup.add(rightAntenna);
    
    // Antenna tips that will pulse when speaking
    const tipGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const tipMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      emissive: secondaryColor,
      emissiveIntensity: 0.8
    });
    
    const leftTip = new THREE.Mesh(tipGeometry, tipMaterial);
    leftTip.position.set(-0.4, 1.2, 0);
    headGroup.add(leftTip);
    
    const rightTip = new THREE.Mesh(tipGeometry, tipMaterial);
    rightTip.position.set(0.4, 1.2, 0);
    headGroup.add(rightTip);
    
    // Create neck
    const neckGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16);
    const neckMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.set(0, -0.85, 0);
    
    // Create body
    const bodyGroup = new THREE.Group();
    
    // Torso
    const torsoGeometry = new THREE.BoxGeometry(1.6, 1.8, 1);
    const torsoMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.3
    });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(0, -1.8, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    bodyGroup.add(torso);
    
    // Chest reactor/light
    const reactorGeometry = new THREE.CircleGeometry(0.3, 32);
    const reactorMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      emissive: primaryColor,
      emissiveIntensity: 0.8,
      side: THREE.DoubleSide
    });
    const reactor = new THREE.Mesh(reactorGeometry, reactorMaterial);
    reactor.position.set(0, -1.4, 0.51);
    reactor.rotation.x = Math.PI / 2;
    bodyGroup.add(reactor);
    
    // Add details to torso
    const addDetailPanel = (x, y, z, width, height, depth) => {
      const panelGeometry = new THREE.BoxGeometry(width, height, depth);
      const panelMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.8,
        roughness: 0.3
      });
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(x, y, z);
      panel.castShadow = true;
      panel.receiveShadow = true;
      bodyGroup.add(panel);
      return panel;
    };
    
    // Add panels to create visual interest
    addDetailPanel(0, -2.2, 0.51, 0.8, 0.3, 0.01);
    addDetailPanel(0.6, -1.7, 0.51, 0.3, 0.6, 0.01);
    addDetailPanel(-0.6, -1.7, 0.51, 0.3, 0.6, 0.01);
    
    // Add shoulder joints
    const shoulderGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const shoulderMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
    leftShoulder.position.set(-0.9, -1.2, 0);
    bodyGroup.add(leftShoulder);
    
    const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
    rightShoulder.position.set(0.9, -1.2, 0);
    bodyGroup.add(rightShoulder);
    
    // Assemble avatar
    avatar.add(headGroup);
    avatar.add(neck);
    avatar.add(bodyGroup);
    
    // Store references to animated parts
    avatar.userData = {
      eyes: [leftEye, rightEye],
      antennaTips: [leftTip, rightTip],
      visor: visor,
      reactor: reactor,
      head: headGroup,
      body: bodyGroup,
      primaryMaterial: headMaterial,
      secondaryMaterials: [tipMaterial, eyeMaterial, reactorMaterial],
      shoulderMaterials: [shoulderMaterial]
    };
    
    // Add to scene
    sceneRef.current.add(avatar);
    avatarRef.current = avatar;
    
    // Position camera to look at avatar
    cameraRef.current.lookAt(avatar.position);
    
    setIsLoaded(true);
  };
  
  // Create humanoid avatar
  const createHumanoidAvatar = (primaryColor, secondaryColor) => {
    const avatar = new THREE.Group();
    
    // Create head
    const headGroup = new THREE.Group();
    
    // Base head
    const headGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.4,
      roughness: 0.6,
      emissive: primaryColor,
      emissiveIntensity: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    headGroup.add(head);
    
    // Face plate
    const faceGeometry = new THREE.SphereGeometry(0.65, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const faceMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f8f8,
      metalness: 0.1,
      roughness: 0.9
    });
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.rotation.x = Math.PI / 2;
    face.position.set(0, 0, 0.1);
    headGroup.add(face);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      emissive: secondaryColor,
      emissiveIntensity: 0.7
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.25, 0.15, 0.58);
    leftEye.scale.z = 0.5;
    headGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.25, 0.15, 0.58);
    rightEye.scale.z = 0.5;
    headGroup.add(rightEye);
    
    // Mouth
    const mouthGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.1);
    const mouthMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222
    });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.2, 0.65);
    headGroup.add(mouth);
    
    // Headset/Crown
    const crownGeometry = new THREE.TorusGeometry(0.6, 0.06, 16, 32, Math.PI);
    const crownMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      metalness: 0.7,
      roughness: 0.3,
      emissive: secondaryColor,
      emissiveIntensity: 0.4
    });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.rotation.x = Math.PI / 2;
    crown.position.set(0, 0.2, 0);
    headGroup.add(crown);
    
    // Neck
    const neckGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.3, 16);
    const neckMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.5,
      roughness: 0.5
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.set(0, -0.8, 0);
    
    // Create body
    const bodyGroup = new THREE.Group();
    
    // Torso
    const torsoGeometry = new THREE.CapsuleGeometry(0.5, 1.2, 8, 16);
    const torsoMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.4,
      roughness: 0.6
    });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(0, -1.8, 0);
    torso.rotation.x = Math.PI / 2;
    torso.castShadow = true;
    torso.receiveShadow = true;
    bodyGroup.add(torso);
    
    // Chest emblem
    const emblemGeometry = new THREE.CircleGeometry(0.2, 32);
    const emblemMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      emissive: secondaryColor,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide
    });
    const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
    emblem.position.set(0, -1.4, 0.51);
    emblem.rotation.x = Math.PI / 2;
    bodyGroup.add(emblem);
    
    // Assemble avatar
    avatar.add(headGroup);
    avatar.add(neck);
    avatar.add(bodyGroup);
    
    // Store references to animated parts
    avatar.userData = {
      eyes: [leftEye, rightEye],
      mouth: mouth,
      crown: crown,
      emblem: emblem,
      head: headGroup,
      body: bodyGroup,
      primaryMaterial: headMaterial,
      secondaryMaterials: [eyeMaterial, crownMaterial, emblemMaterial],
      bodyMaterial: torsoMaterial
    };
    
    // Add to scene
    sceneRef.current.add(avatar);
    avatarRef.current = avatar;
    
    // Position camera to look at avatar
    cameraRef.current.lookAt(avatar.position);
    
    setIsLoaded(true);
  };
  
  // Create animal avatar (fox-inspired)
  const createAnimalAvatar = (primaryColor, secondaryColor) => {
    const avatar = new THREE.Group();
    
    // Create head
    const headGroup = new THREE.Group();
    
    // Base head (fox-like)
    const headGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    headGeometry.scale(1.1, 0.9, 1.1);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.2,
      roughness: 0.8,
      emissive: primaryColor,
      emissiveIntensity: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    headGroup.add(head);
    
    // Snout
    const snoutGeometry = new THREE.ConeGeometry(0.4, 0.8, 32);
    const snoutMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.9
    });
    const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.1, 0.7);
    headGroup.add(snout);
    
    // Nose tip
    const noseGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.1,
      roughness: 0.8
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, -0.15, 1.1);
    nose.scale.set(0.8, 0.8, 0.6);
    headGroup.add(nose);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      emissive: secondaryColor,
      emissiveIntensity: 0.7
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.25, 0.15, 0.65);
    headGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.25, 0.15, 0.65);
    headGroup.add(rightEye);
    
    // Ears
    const earGeometry = new THREE.ConeGeometry(0.2, 0.5, 16);
    const earMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.2,
      roughness: 0.8
    });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.4, 0.6, -0.1);
    leftEar.rotation.x = -Math.PI / 6;
    leftEar.rotation.z = -Math.PI / 6;
    headGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.4, 0.6, -0.1);
    rightEar.rotation.x = -Math.PI / 6;
    rightEar.rotation.z = Math.PI / 6;
    headGroup.add(rightEar);
    
    // Inner ears
    const innerEarGeometry = new THREE.ConeGeometry(0.12, 0.3, 16);
    const innerEarMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdddd,
      metalness: 0.1,
      roughness: 0.9
    });
    
    const leftInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
    leftInnerEar.position.set(-0.4, 0.55, -0.05);
    leftInnerEar.rotation.x = -Math.PI / 6;
    leftInnerEar.rotation.z = -Math.PI / 6;
    headGroup.add(leftInnerEar);
    
    const rightInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
    rightInnerEar.position.set(0.4, 0.55, -0.05);
    rightInnerEar.rotation.x = -Math.PI / 6;
    rightInnerEar.rotation.z = Math.PI / 6;
    headGroup.add(rightInnerEar);
    
    // Tech overlay - like a smart headset
    const techGeometry = new THREE.TorusGeometry(0.6, 0.03, 8, 32, Math.PI);
    const techMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      metalness: 0.7,
      roughness: 0.3,
      emissive: secondaryColor,
      emissiveIntensity: 0.6
    });
    const tech = new THREE.Mesh(techGeometry, techMaterial);
    tech.rotation.x = Math.PI / 2;
    tech.position.set(0, 0.2, -0.1);
    headGroup.add(tech);
    
    // Tech ear pieces
    const earPieceGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.2);
    
    const leftEarPiece = new THREE.Mesh(earPieceGeometry, techMaterial);
    leftEarPiece.position.set(-0.6, 0.1, 0);
    headGroup.add(leftEarPiece);
    
    const rightEarPiece = new THREE.Mesh(earPieceGeometry, techMaterial);
    rightEarPiece.position.set(0.6, 0.1, 0);
    headGroup.add(rightEarPiece);
    
    // Neck - slightly thinner for animal avatar
    const neckGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 16);
    const neckMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.2,
      roughness: 0.8
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.set(0, -0.7, 0);
    
    // Body - more natural/organic for animal
    const bodyGroup = new THREE.Group();
    
    // Torso - slightly smaller for animal
    const torsoGeometry = new THREE.CapsuleGeometry(0.4, 1, 8, 16);
    const torsoMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.2,
      roughness: 0.8
    });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(0, -1.6, 0);
    torso.rotation.x = Math.PI / 2;
    torso.castShadow = true;
    torso.receiveShadow = true;
    bodyGroup.add(torso);
    
    // Tech chest piece
    const chestGeometry = new THREE.CircleGeometry(0.2, 16);
    const chestMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      emissive: secondaryColor,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide
    });
    const chest = new THREE.Mesh(chestGeometry, chestMaterial);
    chest.position.set(0, -1.4, 0.4);
    chest.rotation.x = Math.PI / 2;
    bodyGroup.add(chest);
    
    // Assemble avatar
    avatar.add(headGroup);
    avatar.add(neck);
    avatar.add(bodyGroup);
    
    // Store references to animated parts
    avatar.userData = {
      eyes: [leftEye, rightEye],
      ears: [leftEar, rightEar],
      techParts: [tech, leftEarPiece, rightEarPiece],
      chest: chest,
      head: headGroup,
      body: bodyGroup,
      primaryMaterial: headMaterial,
      secondaryMaterials: [eyeMaterial, techMaterial, chestMaterial],
      bodyMaterial: torsoMaterial
    };
    
    // Add to scene
    sceneRef.current.add(avatar);
    avatarRef.current = avatar;
    
    // Position camera to look at avatar
    cameraRef.current.lookAt(avatar.position);
    
    setIsLoaded(true);
  };
  
  // Update avatar colors based on language
  const updateAvatarColors = () => {
    if (!avatarRef.current) return;
    
    const primaryColor = getPrimaryColor();
    const secondaryColor = getSecondaryColor();
    
    const userData = avatarRef.current.userData;
    
    // Update primary material
    if (userData.primaryMaterial) {
      userData.primaryMaterial.color.set(primaryColor);
      userData.primaryMaterial.emissive.set(primaryColor);
    }
    
    // Update secondary materials
    if (userData.secondaryMaterials) {
      userData.secondaryMaterials.forEach(material => {
        material.color.set(secondaryColor);
        material.emissive.set(secondaryColor);
      });
    }
    
    // Update body material if it exists
    if (userData.bodyMaterial) {
      userData.bodyMaterial.color.set(primaryColor);
    }
    
    // Update shoulder materials if they exist
    if (userData.shoulderMaterials) {
      userData.shoulderMaterials.forEach(material => {
        material.color.set(primaryColor);
      });
    }
  };
  
  // Update speaking animation
  const updateSpeakingAnimation = () => {
    if (!avatarRef.current) return;
    
    const time = timeRef.current;
    const userData = avatarRef.current.userData;
    
    // Calculate pulse factor based on audio input or time
    let pulseFactor;
    if (audioAnalysis && typeof audioAnalysis.volume === 'number') {
      // Use audio analysis if available
      volumeRef.current = THREE.MathUtils.lerp(volumeRef.current, audioAnalysis.volume, 0.3);
      pulseFactor = volumeRef.current;
    } else {
      // Otherwise use sine wave
      pulseFactor = (Math.sin(time * 10) + 1) / 2;
    }
    
    // Apply based on avatar type
    if (avatarType === 'robot') {
      // Pulse antenna tips
      if (userData.antennaTips) {
        userData.antennaTips.forEach(tip => {
          tip.scale.set(
            1 + pulseFactor * 0.5,
            1 + pulseFactor * 0.5
          );
        });
      }
      
      // Pulse visor and reactor
      if (userData.visor) {
        userData.visor.material.emissiveIntensity = 0.3 + pulseFactor * 0.5;
      }
      
      if (userData.reactor) {
        userData.reactor.material.emissiveIntensity = 0.6 + pulseFactor * 0.4;
      }
      
      // Subtle head movement
      if (userData.head) {
        userData.head.rotation.y = Math.sin(time * 3) * 0.1;
        userData.head.rotation.x = Math.sin(time * 4) * 0.05;
      }
    } 
    else if (avatarType === 'humanoid') {
      // Pulse eyes and crown
      if (userData.eyes) {
        userData.eyes.forEach(eye => {
          eye.material.emissiveIntensity = 0.5 + pulseFactor * 0.5;
        });
      }
      
      if (userData.crown) {
        userData.crown.material.emissiveIntensity = 0.3 + pulseFactor * 0.5;
      }
      
      if (userData.emblem) {
        userData.emblem.material.emissiveIntensity = 0.4 + pulseFactor * 0.6;
      }
      
      // Animate mouth when speaking
      if (userData.mouth) {
        userData.mouth.scale.set(1 + pulseFactor * 0.5, 1 + pulseFactor * 2, 1);
      }
      
      // Subtle head movement
      if (userData.head) {
        userData.head.rotation.y = Math.sin(time * 3) * 0.1;
        userData.head.rotation.x = Math.sin(time * 4) * 0.05;
      }
    }
    else if (avatarType === 'animal') {
      // Pulse eyes and tech parts
      if (userData.eyes) {
        userData.eyes.forEach(eye => {
          eye.material.emissiveIntensity = 0.5 + pulseFactor * 0.5;
        });
      }
      
      if (userData.techParts) {
        userData.techParts.forEach(part => {
          part.material.emissiveIntensity = 0.4 + pulseFactor * 0.6;
        });
      }
      
      if (userData.chest) {
        userData.chest.material.emissiveIntensity = 0.4 + pulseFactor * 0.6;
      }
      
      // Animate ears when speaking
      if (userData.ears) {
        userData.ears.forEach((ear, index) => {
          // Left ear and right ear move slightly differently
          const multiplier = index === 0 ? 1 : -1;
          ear.rotation.z = (Math.PI / 6) * multiplier - Math.sin(time * 8) * 0.1 * multiplier;
        });
      }
      
      // More expressive head movement for animal
      if (userData.head) {
        userData.head.rotation.y = Math.sin(time * 2.5) * 0.15;
        userData.head.rotation.x = Math.sin(time * 3.5) * 0.08;
      }
    }
  };
  
  // Update emissive intensity based on state
  const updateEmissiveIntensity = () => {
    if (!avatarRef.current) return;
    
    const userData = avatarRef.current.userData;
    const baseIntensity = isActive ? 0.3 : 0.1;
    
    // Update primary material
    if (userData.primaryMaterial) {
      userData.primaryMaterial.emissiveIntensity = baseIntensity;
    }
    
    // Update secondary materials
    if (userData.secondaryMaterials) {
      const secondaryIntensity = isActive ? 0.6 : 0.2;
      userData.secondaryMaterials.forEach(material => {
        if (!isSpeaking) { // Only update if not speaking (speaking has its own animation)
          material.emissiveIntensity = secondaryIntensity;
        }
      });
    }
  };
  
  // Update avatar when active state changes
  useEffect(() => {
    updateEmissiveIntensity();
  }, [isActive]);
  
  // Update avatar when speaking state changes
  useEffect(() => {
    updateEmissiveIntensity();
  }, [isSpeaking]);
  
  // Handle audio analysis updates
  useEffect(() => {
    if (audioAnalysis && isSpeaking) {
      // Audio analysis is handled in updateSpeakingAnimation
    }
  }, [audioAnalysis, isSpeaking]);
  
  return (
    <div className="relative w-full">
      <motion.div
        ref={containerRef}
        className="w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 shadow-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />
      
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-amber-300 rounded-full animate-spin" />
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
      
      <div className="absolute bottom-3 left-3 right-3 flex justify-between">
        <div className="bg-black/40 text-white text-xs px-2 py-1 rounded-full">
          {isSpeaking ? 'Speaking' : isActive ? 'Listening' : 'Idle'}
        </div>
        
        <div className="bg-black/40 text-white text-xs px-2 py-1 rounded-full">
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