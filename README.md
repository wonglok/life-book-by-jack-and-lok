# Lifebook · 我們的記憶宮殿

> *Reminiscence therapy where the interface is generated, one memory at a time.*

A copilot for the elderly and the social workers who care for them. The user speaks one memory aloud — *"My wedding day in 1972, the jasmine flowers"* — and the copilot doesn't just listen. It builds. A custom memory card. An illustrated storyboard. Follow-up questions picked for that exact memory. A 3D moment to step into. A chapter saved into her Lifebook.

**Every memory produces a different screen. The UI doesn't exist until she remembers.**

Built at the [AI Tinkerers Generative UI Global Hackathon](https://prague.aitinkerers.org/p/generative-ui-global-hackathon-agentic-interfaces-prague), Hong Kong node, May 2026.
**Track 2 · The Copilot That Ships.**

---

## Demo

- 📺 **Demo video:** [coming soon — YouTube unlisted link]
- 🎞️ **Pitch deck:** see `/deck/Lifebook.pptx`
- 🎙️ **Narration audio:** `/public/audio/demo-narration.mp3`

---

## What it is

Reminiscence therapy is an established clinical practice for people living with dementia. Recalling old memories with the right prompts measurably slows decline and lifts mood. The bottleneck has always been **time** — each session needs a trained caregiver, the patient's own photos, and hours most families can't afford.

Lifebook is a copilot built around that bottleneck. The social worker uploads a photo. Mei (78, retired tailor in Sham Shui Po) talks about it. The agent confirms what she said, fills in the missing fields, illustrates the moment, picks the four questions Mei has never been asked, and saves it as a chapter — all inline, all confirmable, all hers.

---

## Why it's a *Copilot That Ships*

Lifebook fits Track 2 because the agent doesn't recommend — it **renders interactive UI for the social worker to confirm, tweak, and execute inline**:

- **Confirm.** A memory card with editable date / place / people / smells / sounds — read back to Mei, tap to correct.
- **Tweak.** Four follow-up questions appear as buttons. Tap one — the chapter expands.
- **Execute.** "Save to Lifebook" ships the chapter into her permanent archive.
- **Adapt.** The agent classifies the emotional tone of each memory and **generates a palette per chapter** — muted dawn rose for a tender memory of her daughter's birth, warm tea-house gold for the wedding. The UI listens, then changes shape *and* tone.

No fixed dashboard. No template. The copilot doesn't just listen — it builds with her.

---

## How it works

1. **Upload.** Social worker uploads a photo from Mei's life.
2. **Speak.** Mei talks about the memory. Audio → text.
3. **Generate.** The agent renders a custom UI per memory — memory card, illustrated storyboard, follow-up questions, optional 3D moment.
4. **Save.** The chapter joins her Lifebook archive — a co-authored family memory book.

---

## Stack

| Layer | What we used |
|---|---|
| Generative UI protocol | **AG-UI** ([@ag-ui/client](https://www.npmjs.com/package/@ag-ui/client), [@ag-ui/mastra](https://www.npmjs.com/package/@ag-ui/mastra)) |
| Copilot framework | **CopilotKit** ([@copilotkit/react-core](https://docs.copilotkit.ai), `react-ui`, `runtime`) |
| Agent runtime | **Mastra** ([@mastra/core](https://mastra.ai), `memory`, `libsql`) |
| Frontend | Next.js 16, React 19, TailwindCSS 4 |
| LLM | DeepSeek V4 Flash (via `@ai-sdk/deepseek`), with OpenAI fallback |
| Image generation | Gemini 2.5 Flash Image (Nano Banana) |
| 3D moments | three.js / R3F + Poly Haven HDRIs |
| Persistence | LibSQL |

---

## Empathic UI for elderly users

We bake elderly-accessibility constraints directly into the agent prompt — non-negotiable:

- WCAG AA contrast (≥ 4.5:1) between body text and surface
- Minimum 18px body text, 1.5 line height
- 44px tap targets (hand-tremor compensation)
- No pure white backgrounds (glare reduction)
- No saturated reds (reduce agitation in dementia patients)
- Maximum 200ms transitions, ease-out only (no startle)

Per-memory tone classification (`warm` / `tender` / `heavy` / `playful` / `proud`) feeds into the rendered card's palette, spacing, and prompt count. Heavy or tender memories get fewer, gentler prompts. The agent answers grief with restraint.

See [`docs/UI_COMPASSION.md`](docs/UI_COMPASSION.md) for the full implementation spec.

---

## Project structure

```
src/
├── app/
│   ├── api/copilotkit/route.ts   # CopilotKit runtime endpoint
│   └── page.tsx                  # Main chat surface
├── components/
│   ├── memory-card.tsx           # Generated chapter UI
│   ├── storyboard-card.tsx       # Illustrated panels
│   └── lifebook-archive.tsx      # Saved chapters list
├── mastra/
│   ├── agents/index.ts           # The Lifebook copilot
│   └── tools/index.ts            # generateChapter, generateStoryboard
└── lib/types.ts                  # Shared schemas

docs/
├── DEMO_SCRIPT.md                # 3-min stage script
├── PERSONA_AND_MEMORIES.md       # Mei's persona + 3 demo memories
├── MEI_VOICE_SAMPLES.md          # Realistic Cantonese-English transcripts
├── STORYBOARD_PROMPTS.md         # 12 image prompts (3 memories × 4 panels)
├── STORYBOARD_EMOTIONAL_RANGE.md # 4 bonus memories spanning emotional range
├── UI_COMPASSION.md              # Empathic UI spec for Lok
└── HDRI_FOR_PALACE.md            # Poly Haven HDRI picks for the 3D Palace

public/
├── mei.png                       # Pixar-style avatar of the demo persona
├── storyboards/                  # Pre-rendered illustrated panels
├── hdri/                         # 3D scene environments
└── audio/                        # Narration & voice samples
```

---

## Quick start

1. **API keys.** Create `.env.local`:
   ```bash
   DEEPSEEK_API_KEY=...   # primary, cheap (~$0.14/M tokens)
   OPENAI_API_KEY=...     # optional fallback
   GOOGLE_API_KEY=...     # for Gemini image generation
   ```

2. **Install.**
   ```bash
   npm install
   ```

3. **Run.**
   ```bash
   npm run dev
   ```

   Starts both the Next.js UI (`localhost:3000`) and the Mastra agent server.

4. **Try a memory.** Type into the chat:
   > *"My wedding day in 1972, the jasmine flowers."*

---

## Available scripts

- `npm run dev` — UI + agent in dev mode
- `npm run dev:ui` — Next.js only
- `npm run dev:agent` — Mastra agent only
- `npm run build` — production build
- `npm start` — production server

---

## Team

- **Jack Ng** — product, persona, demo & narrative direction
- **Lok Wong** — full-stack engineering, agent orchestration, 3D moments

Built in 6 hours at the Regal Kowloon Hotel, Hong Kong.

---

## License

MIT — see [LICENSE](LICENSE).
