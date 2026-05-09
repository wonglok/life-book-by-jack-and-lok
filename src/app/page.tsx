"use client";

import { ProverbsCard } from "@/components/proverbs";
import { WeatherCard } from "@/components/weather";
import { MoonCard } from "@/components/moon";
import { AgentState } from "@/lib/types";
import { useCoAgent, useCopilotAction } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Cards } from "./_compos/3D/Cards";
import { AgentStateType } from "@/mastra/agents";
import {
  Center,
  MeshTransmissionMaterial,
  OrbitControls,
  Text3D,
} from "@react-three/drei";
import MemoryThankYouCard from "@/components/memory-thankyou-card";
import MemoryList from "@/components/memory-list";
import { MemoryLoader } from "@/components/memory-loader";
import slugify from "slugify";
import { Logo } from "./_compos/3D/Logo/Logo";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { Bubble } from "./_compos/3D/Bubble/Bubble";
import { useApp } from "./_compos/3D/useApp";
export default function CopilotKitPage() {
  const [themeColor, setThemeColor] = useState("#6366f1");

  // // 🪁 Frontend Actions: https://docs.copilotkit.ai/mastra/frontend-actions
  // useCopilotAction({
  //   name: "setThemeColor",
  //   parameters: [
  //     {
  //       name: "themeColor",
  //       description: "The theme color to set. Make sure to pick nice colors.",
  //       required: true,
  //     },
  //   ],
  //   handler({ themeColor }) {
  //     setThemeColor(themeColor);
  //   },
  // });

  return (
    <main
      style={
        { "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties
      }
    >
      <CopilotSidebar
        disableSystemMessage={true}
        clickOutsideToClose={false}
        labels={{
          title: "Popup Assistant",
          initial: "👋 Hi, there! You're chatting with an agent.",
        }}
        suggestions={[
          {
            title: "Generative UI",
            message: "Get the weather in San Francisco.",
          },
          {
            title: "Frontend Tools",
            message: "Set the theme to green.",
          },
          {
            title: "Human In the Loop",
            message: "Please go to the moon.",
          },
          {
            title: "Write Agent State",
            message: "Add a proverb about AI.",
          },
          {
            title: "Update Agent State",
            message:
              "Please remove 1 random proverb from the list if there are any.",
          },
          {
            title: "Read Agent State",
            message: "What are the proverbs?",
          },
        ]}
      >
        <MemoryLoader
          insert={(data) => {
            return (
              <>
                {data instanceof Array && (
                  <YourMainContent data={data} themeColor={themeColor} />
                )}
              </>
            );
          }}
        ></MemoryLoader>
      </CopilotSidebar>
    </main>
  );
}

function YourMainContent({
  data,
  themeColor,
}: {
  data: any;
  themeColor: string;
}) {
  //
  let first = data?.[0];
  console.log("first", first);

  console.log("imageAndInspiration", first?.imageAndInspiration);
  // 🪁 Shared State: https://docs.copilotkit.ai/mastra/shared-state/in-app-agent-read
  const { state, setState, name } = useCoAgent<AgentStateType>({
    name: "weatherAgent",
    initialState: {
      memories: first?.imageAndInspiration || [],
    },
  });
  const agent = useAgent({ agentId: name });

  // //🪁 Generative UI: https://docs.copilotkit.ai/mastra/generative-ui/tool-based
  // useCopilotAction(
  //   {
  //     name: "weatherTool",
  //     description: "Get the weather for a given location.",
  //     available: "disabled",
  //     parameters: [{ name: "location", type: "string", required: true }],
  //     render: ({ args }) => {
  //       return <WeatherCard location={args.location} themeColor={themeColor} />;
  //     },
  //   },
  //   [themeColor],
  // );

  // // 🪁 Human In the Loop: https://docs.copilotkit.ai/mastra/human-in-the-loop
  // useCopilotAction(
  //   {
  //     name: "go_to_moon",
  //     description: "Go to the moon on request.",
  //     renderAndWaitForResponse: ({ respond, status }) => {
  //       return (
  //         <MoonCard themeColor={themeColor} status={status} respond={respond} />
  //       );
  //     },
  //   },
  //   [themeColor],
  // );

  useCopilotAction({
    name: "set theme color",
    parameters: [
      {
        name: "color",
        description: "The theme color to set. Make sure to pick nice colors.",
        required: true,
      },
    ],
    handler({ color }) {
      console.log(color);

      useApp.setState({ moodColor1: color });

      //
    },
  });
  const { copilotkit } = useCopilotKit();

  return (
    <div style={{ backgroundColor: themeColor }} className="h-screen relative">
      <div className="flex h-full w-full">
        <div className="h-full overflow-scroll" style={{ width: `350px` }}>
          <div className="text-white p-5">Welcome to lifebook!</div>
          <div className="p-5">
            <>
              <MemoryThankYouCard></MemoryThankYouCard>
            </>
            <>
              <MemoryList></MemoryList>
            </>
          </div>
        </div>
        <div
          className="h-full relative"
          onWaitingCapture={(r) => {
            r.stopPropagation();
            r.preventDefault();
          }}
          style={{ width: `calc(100% - 350px)` }}
        >
          <Canvas>
            <Suspense fallback={null}>
              <Cards state={state} setState={setState}></Cards>
            </Suspense>
            <Suspense fallback={null}>
              <Logo></Logo>
            </Suspense>
            <Suspense fallback={null}>
              <Bubble></Bubble>
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false}></OrbitControls>
          </Canvas>

          <div className=" absolute bottom-[5%] left-[5%] right-[5%] h-[100px] bg-white rounded-2xl p-3">
            <button
              className="p-2 bg-gray-200 bodder rounded-2xl"
              onClick={() => {
                //
                agent.agent.addMessage({
                  role: "user",
                  content: `I want to see touching moments, please suggest me some memories and set the theme color based on the moment.`,
                  id: `_${Math.random().toString(36).slice(2, 9)}`,
                });
                copilotkit.runAgent({ agent: agent.agent });
              }}
            >
              See Touching Moments
            </button>
          </div>
        </div>
      </div>
      {/* <ProverbsCard state={state} setState={setState} /> */}
    </div>
  );
}
