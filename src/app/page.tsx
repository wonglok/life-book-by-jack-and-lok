"use client";

import { ProverbsCard } from "@/components/proverbs";
import { WeatherCard } from "@/components/weather";
import { MoonCard } from "@/components/moon";
import { AgentState } from "@/lib/types";
import { useCoAgent, useCopilotAction } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Cards } from "./_compos/3D/Cards";
import { AgentStateType } from "@/mastra/agents";
import { OrbitControls } from "@react-three/drei";
import MemoryThankYouCard from "@/components/memory-thankyou-card";
import MemoryList from "@/components/memory-list";

export default function CopilotKitPage() {
  const [themeColor, setThemeColor] = useState("#6366f1");

  // 🪁 Frontend Actions: https://docs.copilotkit.ai/mastra/frontend-actions
  useCopilotAction({
    name: "setThemeColor",
    parameters: [
      {
        name: "themeColor",
        description: "The theme color to set. Make sure to pick nice colors.",
        required: true,
      },
    ],
    handler({ themeColor }) {
      setThemeColor(themeColor);
    },
  });

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
        <YourMainContent themeColor={themeColor} />
      </CopilotSidebar>
    </main>
  );
}

function YourMainContent({ themeColor }: { themeColor: string }) {
  // 🪁 Shared State: https://docs.copilotkit.ai/mastra/shared-state/in-app-agent-read
  const { state, setState } = useCoAgent<AgentStateType>({
    name: "weatherAgent",
    initialState: {
      memories: [
        {
          slug: "hi",
          memory: "how are you?",
        },
      ],
    },
  });

  //🪁 Generative UI: https://docs.copilotkit.ai/mastra/generative-ui/tool-based
  useCopilotAction(
    {
      name: "weatherTool",
      description: "Get the weather for a given location.",
      available: "disabled",
      parameters: [{ name: "location", type: "string", required: true }],
      render: ({ args }) => {
        return <WeatherCard location={args.location} themeColor={themeColor} />;
      },
    },
    [themeColor],
  );

  // 🪁 Human In the Loop: https://docs.copilotkit.ai/mastra/human-in-the-loop
  useCopilotAction(
    {
      name: "go_to_moon",
      description: "Go to the moon on request.",
      renderAndWaitForResponse: ({ respond, status }) => {
        return (
          <MoonCard themeColor={themeColor} status={status} respond={respond} />
        );
      },
    },
    [themeColor],
  );

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
        <div className="h-full" style={{ width: `calc(100% - 350px)` }}>
          <Canvas>
            <Suspense fallback={null}>
              <Cards state={state} setState={setState}></Cards>
            </Suspense>
            <OrbitControls></OrbitControls>
          </Canvas>
        </div>
      </div>
      {/* <ProverbsCard state={state} setState={setState} /> */}
    </div>
  );
}
