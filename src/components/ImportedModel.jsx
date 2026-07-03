import { useEffect, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Renders an imported GLB/GLTF model, auto-centered and auto-scaled
 * to fit nicely within the viewport regardless of original model dimensions.
 */
export default function ImportedModel({ scene: importedScene }) {
  const groupRef = useRef();

  // Clone the scene so we don't mutate the cached original
  const clonedScene = useMemo(() => {
    const clone = importedScene.clone(true);
    
    // Compute the bounding box of the entire model
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Calculate uniform scale to fit model within a ~4 unit bounding sphere
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 4;
    const scale = maxDim > 0 ? targetSize / maxDim : 1;

    clone.scale.setScalar(scale);

    // Re-center the model so it sits at the origin, resting on the ground plane (Y=0)
    const scaledBox = new THREE.Box3().setFromObject(clone);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    const scaledMin = scaledBox.min;

    clone.position.x -= scaledCenter.x;
    clone.position.z -= scaledCenter.z;
    clone.position.y -= scaledMin.y; // Rest on ground

    // Enable shadows on all meshes
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return clone;
  }, [importedScene]);

  // Gentle idle rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}
