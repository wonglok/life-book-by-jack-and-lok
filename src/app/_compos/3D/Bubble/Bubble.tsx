import {
  Center,
  MeshTransmissionMaterial,
  Sphere,
  Text3D,
  useEnvironment,
} from "@react-three/drei";
import { useState } from "react";
import { useApp } from "../useApp";
import { DoubleSide } from "three";

export const Bubble = () => {
  const sunset = useEnvironment({
    files: [`/hdr/museum_of_ethnography_1k.hdr`],
  });
  const moodColor1 = useApp((r) => r.moodColor1);
  return (
    <group>
      {/* <Text3D
        bevelEnabled
        bevelSize={0.025}
        font={`/fonts/helvetiker_regular.typeface.json`}
      >
        {`Lifebook`}

        <MeshTransmissionMaterial
          envMap={sunset}
          thickness={2}
          metalness={0.2}
          reflectivity={2}
          chromaticAberration={0.5}
          anisotropicBlur={1.5}
        ></MeshTransmissionMaterial>
      </Text3D> */}
      <group>
        <Sphere scale={100}>
          <meshPhysicalMaterial
            side={DoubleSide}
            color={moodColor1}
          ></meshPhysicalMaterial>
        </Sphere>
        {/*  */}

        {/*  */}
      </group>
    </group>
  );
};
