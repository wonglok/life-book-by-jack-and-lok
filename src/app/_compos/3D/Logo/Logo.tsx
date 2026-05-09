import {
  Center,
  MeshTransmissionMaterial,
  Text3D,
  useEnvironment,
} from "@react-three/drei";

export const Logo = () => {
  const sunset = useEnvironment({
    files: [`/hdr/museum_of_ethnography_1k.hdr`],
  });
  return (
    <group>
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
      ;
    </group>
  );
};
