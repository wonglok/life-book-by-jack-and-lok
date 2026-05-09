import { Center, Circle, Html, Image, MeshTransmissionMaterial, Plane, RoundedBox, Stars, Text3D, useVideoTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Gesture } from '@use-gesture/vanilla'
import { CatmullRomCurve3, DoubleSide, FrontSide, ImageLoader, TextureLoader, Vector2, Vector3, VideoTexture } from "three";
import { v4 } from "uuid";

let cards = [
    {
        _id: `${v4()}`,
        color: 'red',
        text: `Hi I'm Lok Lok.`,
        type: 'image',
        url: ``,
        link: `https://github.com/wonglok`,
    },
]

export function Landing() {
    let gl = useThree(r => r.gl)

    let [uiState,] = useState({
        dy: -340,
        reducer: 0.933
    })

    useFrame(() => {
        uiState.dy *= uiState.reducer
    })

    useEffect(() => {

        let gesture = new Gesture(gl.domElement, {
            onDrag: (ev) => {
                uiState.dy += (ev.delta[0] + ev.delta[1] * -1) * 0.85

                ev.event.preventDefault()
            },
            onWheel: (ev) => {
                uiState.dy += ((ev.delta[1] + ev.delta[0]) * 1.5 * -1.0)

                ev.event.preventDefault()
            }
        }, {
            target: {
                current: gl.domElement
            },
            enabled: true,
            eventOptions: {
                passive: false,
            },
        })

        gl.domElement.addEventListener('touchstart', (ev) => {
            ev.preventDefault()
        })
        gl.domElement.addEventListener('touchmove', (ev) => {
            ev.preventDefault()
        })

        gl.domElement.parentElement.style.touchAction = 'none'
        gl.domElement.style.touchAction = 'none'
        return () => {
            gesture.destroy();
        }
    }, [gl, uiState])

    let viewport = useThree(r => r.viewport);

    let vm = Math.min(viewport.height, viewport.height);
    let {
        curvePosition,
        curveRotaion
    } = useMemo(() => {
        let position = []
        let rotation = []
        let opaicty = []
        let n = cards.length;

        rotation.push(new Vector3(0, 0, 0))

        for (let i = -n; i <= n; i++) {
            position.push(new Vector3(i * vm * 0.5, 0, i / n * 50 - 50))
            rotation.push(new Vector3(0.0, 0.0, -(i / n + 0.4) * Math.PI * 0.0))
            opaicty.push(i / n, 0, 0)
        }

        let curvePosition = new CatmullRomCurve3(position, false, 'catmullrom')
        let curveRotaion = new CatmullRomCurve3(rotation, false, 'catmullrom')

        return {
            curveRotaion,
            curvePosition
        }
    }, [viewport.width, viewport.height])

    return <>

        <group name="cards" position={[0, 0, 0]} scale={[1, 1, 1]} rotation={[0, 0, 0]}>
            {cards.map((card, i, a) => {
                return <Slide key={card._id} card={card} i={i} uiState={uiState} curveRotaion={curveRotaion} curvePosition={curvePosition} a={a}></Slide>
            })}
        </group>

        <CurrnetDisplay></CurrnetDisplay>
    </>
}

/**
 * 
 * @param {{curvePosition: CatmullRomCurve3}}  
 * @returns 
 */
function Slide({ card, i, a, uiState, curvePosition, curveRotaion }) {
    let ref = useRef()

    let loop = useRef((i / (a.length)))
    let v3 = new Vector3()
    let viewport = useThree(r => r.viewport);
    let vm = Math.min(viewport.height, viewport.height)
    useFrame(() => {
        //

        loop.current += uiState.dy * 0.0001

        if (loop.current >= 1) {
            loop.current += -1
        } else if (loop.current <= 0) {
            loop.current += 1
        }

        curvePosition.getPointAt(loop.current, ref.current.position)
        curveRotaion.getPointAt(loop.current, ref.current.rotation)

        ref.current.rotation.y += -uiState.dy / 200

        curveRotaion.getPointAt(loop.current, v3)

        if (ref.current) {
            let item = ref.current.getObjectByName(card._id)

            if (item) {
                item.material.zoom = (-loop.current * 0.5 + 1.5)

                // let sim = (loop.current * (1.0 - loop.current))
                // item.material.radius = (sim * vm * 2.0)
            }
        }
    })

    let [tex, setTex] = useState(null)

    useEffect(() => {
        if (card.type === 'image') {
            let img = new TextureLoader()
            img.loadAsync(card.url).then(tex => {
                setTex(tex)
            })
        }
    }, [card])

    return <group frustumCulled={false} ref={ref} >

        <group scale={1.3}>

            <Suspense fallback={null}>
                {tex && <>
                    <Image name={card._id} userData={{ card }} radius={2} texture={tex} scale={[vm * 0.7, vm, 1]} side={DoubleSide} transparent>
                    </Image>
                </>}
            </Suspense>

            <Stars radius={5} count={500} fade></Stars>
        </group>
    </group>
}



function CurrnetDisplay() {
    let viewport = useThree(r => r.viewport)

    let [card, setCard] = useState(false)

    useFrame(({ raycaster, camera, scene }) => {
        raycaster.setFromCamera(new Vector2(0, 0), camera)
        let items = raycaster.intersectObject(scene, true)
        let result = items.find(r => r?.object?.userData?.card)
        if (result) {
            if (result.object.userData.card) {

                if (card !== result.object.userData.card) {
                    setCard(result.object.userData.card)
                }
            }
        }
    })

    return <>
        {card &&
            <group position={[0, -0.5 * viewport.height + 6, 0]}>

                <Center key={card._id} back scale={viewport.width * 0.0325}>
                    <Text3D font={`/threejs-font/fonts/optimer_bold.typeface.json`} height={0.015} bevelEnabled bevelSegments={2} bevelSize={0.05} >
                        {card.text}
                        <MeshTransmissionMaterial color={card.color} roughness={0.1} anisotropicBlur={1} metalness={0.0} thickness={2} transmission={1}>
                        </MeshTransmissionMaterial>
                    </Text3D>
                </Center>

                <group position={[viewport.width * 0.0 - 1.5 * 2 * 0.0, -3.5, 0]}>
                    <Image transparent position={[0, 0, 0.0]} url={`/icon/external-link-icon.png`} />
                    <Circle position={[0, 0, 0]} scale={1.35}>
                    </Circle>
                    <Html center transform scale={1.5}><a target="_blank" href={card.link}><div className="w-[100px] h-[100px] opacity-0 bg-white" ></div> </a></Html>
                </group>

            </group>
        }

        <group position={[0, 0.5 * 1 * viewport.height - 3, 0]}>
            <group position={[viewport.width * 0.5 - 1.5 * 2, 0, 0]}>
                <Image transparent position={[0, 0, 0.0]} url={`/lok/business-card-icon.png`} />
                <Circle position={[0, 0, 0]} scale={1.35}>
                </Circle>
                <Html center transform scale={1.5}><a target="_blank" href={`/lok/vcard.vcf`}><div className="w-[100px] h-[100px] opacity-0 bg-white" ></div> </a></Html>
            </group>
        </group>

        {/*  */}
    </>
}

//