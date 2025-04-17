"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { motion } from 'framer-motion';

export default function AITutorAvatar({ 
  isActive = false, 
  isSpeaking = false,
  languageCode = 'en',
  avatarType = 'robot' // Options: 'robot', 'humanoid', 'animal'
}) {
  const containerRef = useRef(null);
  const renderer = useRef(null);
  const scene = useRef(null);
  const camera = useRef(null);
  const controls = useRef(null);
  const avatar = useRef(null);
  const mixer = useRef(null);
  const animationActions = useRef({});
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);
  const [currentAnimState, setCurrentAnimState] = useState('idle');
  
  // Avatar color mapping based on language
  const languageColors = {
    en: '#2563eb', // Blue
    es: '#dc2626', // Red
    fr: '#0284c7', // Sky
    de: '#4d7c0f', // Green
    ja: '#db2777', // Pink
    zh: '#f59e0b', // Amber
    ko: '#4338ca', // Indigo
    ru: '#be123c', // Rose
    ar: '#059669', // Emerald
    it: '#16a34a', // Green
    pt: '#65a30d', // Lime
    hi: '#f97316', // Orange
  };
  
  const getAvatarColor = () => {
    return languageColors[languageCode] || '#6366f1'; // Default to Indigo
  };
  
  const getAvatarModel = () => {
    // Different avatar models based on type
    switch(avatarType) {
      case 'humanoid':
        return '/assets/models/ai-humanoid.glb';
      case 'animal':
        return '/assets/models/ai-animal.glb';
      case 'robot':
      default:
        return '/assets/models/ai-robot.glb';
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    scene.current = new THREE.Scene();
    scene.current.background = new THREE.Color(0xf3f4f6);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.current.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(1, 2, 3);
    scene.current.add(dirLight);
    
    // Create camera
    camera.current = new THREE.PerspectiveCamera(
      40, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.current.position.set(0, 1.5, 4);
    
    // Create renderer
    renderer.current = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.current.setSize(
      containerRef.current.clientWidth, 
      containerRef.current.clientHeight
    );
    renderer.current.setClearColor(0x000000, 0);
    renderer.current.setPixelRatio(window.devicePixelRatio);
    renderer.current.outputEncoding = THREE.CustomBlending;
    renderer.current.shadowMap.enabled = true;
    
    // Add renderer to DOM
    containerRef.current.appendChild(renderer.current.domElement);
    
    // Add orbit controls
    controls.current = new OrbitControls(camera.current, renderer.current.domElement);
    controls.current.enableDamping = true;
    controls.current.dampingFactor = 0.05;
    controls.current.screenSpacePanning = false;
    controls.current.minDistance = 2;
    controls.current.maxDistance = 8;
    controls.current.maxPolarAngle = Math.PI / 2;
    controls.current.enableZoom = false;
    controls.current.enablePan = false;
    
    // Mock model loading for demo purposes
    const loadModel = async () => {
      try {
        // In a real implementation, we would load a model from a file
        // For this example, let's create a placeholder robot
        
        // Create robot head
        const head = new THREE.Group();
        
        const headGeometry = new THREE.BoxGeometry(1, 1, 1);
        const headMaterial = new THREE.MeshStandardMaterial({ 
          color: getAvatarColor(),
          metalness: 0.8,
          roughness: 0.2,
        });
        const headMesh = new THREE.Mesh(headGeometry, headMaterial);
        head.add(headMesh);
        
        // Add eyes
        const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffffff,
          emissive: 0x66ccff,
          emissiveIntensity: 0.5
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.25, 0.15, 0.5);
        head.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.25, 0.15, 0.5);
        head.add(rightEye);
        
        // Add mouth
        const mouthGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.1);
        const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.3, 0.5);
        head.add(mouth);
        
        // Add antennas
        const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4);
        const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        leftAntenna.position.set(-0.3, 0.7, 0);
        head.add(leftAntenna);
        
        const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        rightAntenna.position.set(0.3, 0.7, 0);
        head.add(rightAntenna);
        
        // Add antenna balls
        const ballGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const ballMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x66ccff,
          emissive: 0x66ccff,
          emissiveIntensity: 0.8
        });
        
        const leftBall = new THREE.Mesh(ballGeometry, ballMaterial);
        leftBall.position.set(-0.3, 0.9, 0);
        head.add(leftBall);
        
        const rightBall = new THREE.Mesh(ballGeometry, ballMaterial);
        rightBall.position.set(0.3, 0.9, 0);
        head.add(rightBall);
        
        // Create body
        const body = new THREE.Group();
        
        const torsoGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.8);
        const torsoMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x333333,
          metalness: 0.8,
          roughness: 0.2
        });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.set(0, -1.25, 0);
        body.add(torso);
        
        // Add chest light
        const lightGeometry = new THREE.CircleGeometry(0.2, 32);
        const lightMaterial = new THREE.MeshStandardMaterial({ 
          color: getAvatarColor(),
          emissive: getAvatarColor(),
          emissiveIntensity: 0.8,
          side: THREE.DoubleSide
        });
        const chestLight = new THREE.Mesh(lightGeometry, lightMaterial);
        chestLight.position.set(0, -0.8, 0.4);
        chestLight.rotation.x = Math.PI / 2;
        body.add(chestLight);
        
        // Combine everything
        avatar.current = new THREE.Group();
        avatar.current.add(head);
        avatar.current.add(body);
        
        // Add to scene
        scene.current.add(avatar.current);
        
        // Position camera to look at avatar
        camera.current.lookAt(avatar.current.position);
        
        setIsAvatarLoaded(true);
      } catch (error) {
        console.error('Error loading avatar model:', error);
      }
    };
    
    loadModel();
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controls.current) {
        controls.current.update();
      }
      
      if (mixer.current) {
        mixer.current.update(0.016); // Update animations
      }
      
      if (avatar.current) {
        // Add some subtle movement to make the avatar feel alive
        const time = Date.now() * 0.001;
        
        // Floating motion
        avatar.current.position.y = Math.sin(time) * 0.05;
        
        // Subtle rotation
        avatar.current.rotation.y = Math.sin(time * 0.5) * 0.1;
        
        // If speaking, make the antennas pulse
        if (isSpeaking && avatar.current.children[0]) {
          const head = avatar.current.children[0];
          const leftBall = head.children[6];
          const rightBall = head.children[7];
          const mouth = head.children[4];
          
          const pulseFactor = (Math.sin(time * 10) + 1) / 2;
          
          leftBall.scale.set(
            1 + pulseFactor * 0.5,
            1 + pulseFactor * 0.5,
            1 + pulseFactor * 0.5
          );
          
          rightBall.scale.set(
            1 + pulseFactor * 0.5,
            1 + pulseFactor * 0.5,
            1 + pulseFactor * 0.5
          );
          
          // Animate mouth when speaking
          mouth.scale.set(1, 1 + pulseFactor, 1);
        }
      }
      
      renderer.current.render(scene.current, camera.current);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.current.updateProjectionMatrix();
      renderer.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && renderer.current) {
        containerRef.current.removeChild(renderer.current.domElement);
      }
      
      renderer.current?.dispose();
      controls.current?.dispose();
    };
  }, []);
  
  // Update avatar color when language changes
  useEffect(() => {
    if (avatar.current && avatar.current.children[0]) {
      const head = avatar.current.children[0];
      const headMesh = head.children[0];
      headMesh.material.color.set(getAvatarColor());
      
      // Update chest light color
      const body = avatar.current.children[1];
      const chestLight = body.children[1];
      chestLight.material.color.set(getAvatarColor());
      chestLight.material.emissive.set(getAvatarColor());
    }
  }, [languageCode]);
  
  // Update animation state based on props
  useEffect(() => {
    if (!isActive) {
      setCurrentAnimState('idle');
    } else if (isSpeaking) {
      setCurrentAnimState('speaking');
    } else {
      setCurrentAnimState('listening');
    }
  }, [isActive, isSpeaking]);
  
  // Handle animation state changes
  useEffect(() => {
    if (!avatar.current) return;
    
    // These would be actual animations in a real implementation
    switch (currentAnimState) {
      case 'speaking':
        // Implemented directly in the animation loop
        break;
      case 'listening':
        // Add subtle head tilting or other listening behaviors
        break;
      case 'idle':
      default:
        // Reset animations
        break;
    }
  }, [currentAnimState]);
  
  // This would be a great place to implement audio visualization
  // by analyzing the audio input and using it to drive animations
  
  return (
    <div className="relative w-full">
      <motion.div
        ref={containerRef}
        className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: isAvatarLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />
      
      {!isAvatarLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-slate-300 rounded-full animate-spin" />
        </div>
      )}
      
      <div className="absolute bottom-3 left-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
        {currentAnimState === 'speaking' ? 'Speaking' : 
         currentAnimState === 'listening' ? 'Listening' : 'Idle'}
      </div>
    </div>
  );
}