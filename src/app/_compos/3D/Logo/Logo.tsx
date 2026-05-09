import {
  Box,
  Center,
  MeshTransmissionMaterial,
  RoundedBox,
  Text3D,
  useEnvironment,
  useTexture,
} from "@react-three/drei";

export const Logo = () => {
  const sunset = useEnvironment({
    files: [`/hdr/museum_of_ethnography_1k.hdr`],
  });
  const texture = useTexture("/image/logo.jpeg");
  return (
    <group>
      <Center>
        <Text3D
          scale={[1, 1, 0.5]}
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
      <Box position={[0, 1.2, -0.5]} scale={[2, 2, 0.1]}>
        <meshStandardMaterial
          roughness={1}
          envMap={sunset}
          map={texture}
        ></meshStandardMaterial>
      </Box>
    </group>
  );
};
