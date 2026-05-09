"use client";
import {
  Box,
  Center,
  Environment,
  MeshTransmissionMaterial,
  OrbitControls,
  RoundedBoxGeometry,
  Text3D,
  useEnvironment,
} from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { Mesh, MeshBasicMaterial, Object3D, PlaneGeometry } from "three";
import { useThree } from "@react-three/fiber";
import { AgentStateType } from "@/mastra/agents";

export interface ProverbsCardProps {
  state: AgentStateType;
  setState: (state: AgentStateType) => void;
}

export function Cards({ state, setState }: ProverbsCardProps) {
  let refCurrent = useRef(0);

  useEffect(() => {
    refCurrent.current = 0;

    const evt = (ev: any) => {
      //
      //
      refCurrent.current += ev.deltaY;
      //
      //
      console.log(refCurrent.current);
      //
      //
    };
    window.addEventListener("wheel", evt);
    return () => {
      window.removeEventListener("wheel", evt);
    };
  }, []);

  console.log(state);

  const sunset = useEnvironment({
    files: [`/hdr/museum_of_ethnography_1k.hdr`],
  });
  return (
    <>
      <Environment
        files={[`/hdr/museum_of_ethnography_1k.hdr`]}
        background
      ></Environment>

      {state?.memories?.map((mem, idx) => {
        return (
          <group key={mem.slug + idx}>
            <OneCard info={mem}></OneCard>
          </group>
        );
      })}

      <Center>
        <Text3D
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
        </Text3D>
      </Center>

      {/*  */}
      {/* <O    rbitControls></OrbitControls> */}
    </>
  );
}

function OneCard({ info }: any) {
  console.log(info);
  return (
    <group>
      <mesh>
        <RoundedBoxGeometry
          args={[1, 1, 0.2]}
          radius={0.1}
        ></RoundedBoxGeometry>
        <meshPhysicalMaterial
          transmission={1}
          roughness={0.1}
          metalness={0.2}
        ></meshPhysicalMaterial>
      </mesh>
    </group>
  );
}
