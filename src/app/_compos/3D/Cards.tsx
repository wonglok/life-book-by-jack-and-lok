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
import { useFrame, useThree } from "@react-three/fiber";
import { AgentStateType } from "@/mastra/agents";

export interface ProverbsCardProps {
  state: AgentStateType;
  setState: (state: AgentStateType) => void;
}

export function Cards({ state, setState }: ProverbsCardProps) {
  let refAccuDelta = useRef(0);
  let refAccuTotal = useRef(0);
  let refDelta = useRef(0);

  console.log("state", state);

  useFrame(() => {
    refAccuDelta.current *= 0.95;
    refAccuTotal.current += refAccuDelta.current;

    //
    console.log(refAccuTotal.current);
  });

  useEffect(() => {
    refAccuDelta.current = 0;

    const evt = (ev: any) => {
      //
      //
      refDelta.current = -ev.deltaY / 100;
      refAccuDelta.current += -ev.deltaY / 100;

      //
      //
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
