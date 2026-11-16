/**
 * DON'T GO — starter TypeScript contracts
 *
 * Companion to DONT_GO_SPEC.md. These are architectural contracts, NOT an
 * implementation. Copy into the React/TypeScript project and refine as needed.
 * The narrative engine should remain DOM-independent; browser/UI integration
 * lives behind command sinks and mutation adapters.
 */

// ---------------------------------------------------------------------------
// Session and progression
// ---------------------------------------------------------------------------

export type SessionStatus = 'active' | 'suspended' | 'terminating' | 'dead';
export type TerminationReason = 'player' | 'navigation' | 'reload' | 'external';

export type NarrativeStage =
  | 'legacy'
  | 'design'
  | 'interactive'
  | 'personalized'
  | 'desperate';

export type DesignEra =
  | 'legacy'
  | 'web2'
  | 'modern'
  | 'experimental'
  | 'personalized'
  | 'terminal';

export type DesignFamily = 'nature' | 'space' | 'room' | 'desktop';

export type CharacterVariable =
  | 'fear'
  | 'attachment'
  | 'confidence'
  | 'curiosity'
  | 'frustration'
  | 'playfulness'
  | 'urgency';

export type CharacterState = Record<CharacterVariable, number>; // clamp 0–100
export type PreferenceTag =
  | 'playful' | 'calm' | 'beautiful' | 'nostalgic' | 'minimal'
  | 'chaotic' | 'interactive' | 'cozy' | 'surreal'
  | (string & {});

export type BeatStatus =
  | 'selected' | 'running' | 'suspended' | 'completed'
  | 'abandoned' | 'failed';

export interface ActiveBeatState {
  beatId: string;
  status: BeatStatus;
  stepIndex: number;
  startedAtMs: number;
  checkpoint?: string;
  suspensionReason?: string;
}

export interface DialogueMessage {
  id: string;
  lineId: string;
  text: string;
  atMs: number;
  speaker: 'ai' | 'player' | 'system';
  interrupted?: boolean;
}

export interface StoryState {
  session: {
    id: string;
    status: SessionStatus;
    startedAtMs: number;
    activeElapsedMs: number;
    terminationReason?: TerminationReason;
    seed: number;
  };
  narrative: {
    stage: NarrativeStage;
    tension: number; // clamp 0–100
    activeBeat: ActiveBeatState | null;
    completedBeats: string[];
    abandonedBeats: string[];
    flags: Record<string, boolean>;
    facts: Record<string, string | number | boolean>;
  };
  character: CharacterState;
  player: {
    preferences: Record<string, number>; // tag-weight mapping
    interestFacts: string[];
    notableInteractions: string[];
    estimatedDepartureInterest: number; // 0–100, explicitly heuristic
  };
  design: {
    era: DesignEra;
    family: DesignFamily | null;
    environmentId: string | null;
    activeMutationIds: string[];
    mutationParams: Record<string, Record<string, unknown>>;
  };
  behavior: {
    activeBehaviorId: string | null;
    cooldownUntilMs: Record<string, number>;
    recentRealizationIds: string[];
    exitApproachEpisodes: number;
    exitMovedThisSession: boolean;
    lastVisibleActionAtMs: number | null;
  };
  dialogue: {
    messages: DialogueMessage[];
    activeChoiceGroupId: string | null;
    typingLineId: string | null;
  };
}

// ---------------------------------------------------------------------------
// Normalized application events — not raw pointermove/React events
// ---------------------------------------------------------------------------

interface EventBase { atMs: number }

export type StoryEvent =
  | (EventBase & {
      type: 'CHOICE_SELECTED';
      choiceId: string;
      intentId: string;
    })
  | (EventBase & {
      type: 'POINTER_NEAR_EXIT';
      episodeId: string;
      dwellMs: number;
      closestDistancePx: number;
    })
  | (EventBase & {
      type: 'EXIT_HOVERED';
      episodeId: string;
      dwellMs: number;
    })
  | (EventBase & {
      type: 'POINTER_LEFT_EXIT';
      episodeId: string;
    })
  | (EventBase & {
      type: 'EXIT_ACTIVATED';
    })
  | (EventBase & {
      type: 'PLAYER_IDLE';
      durationMs: number;
    })
  | (EventBase & {
      type: 'PLAYER_HIDDEN';
    })
  | (EventBase & {
      type: 'PLAYER_RETURNED';
      awayMs: number;
    })
  | (EventBase & {
      type: 'VIEWPORT_RESIZED';
      width: number;
      height: number;
    })
  | (EventBase & {
      type: 'OBJECT_INTERACTED';
      mutationId: string;
      objectId: string;
      action: 'click' | 'drag' | 'drop' | 'hover' | 'complete';
    })
  | (EventBase & {
      type: 'FEATURE_FEEDBACK';
      mutationId: string;
      sentiment: 'positive' | 'negative';
      explicit: boolean;
    })
  | (EventBase & {
      type: 'FEATURE_IGNORED';
      mutationId: string;
      observationMs: number;
    })
  | (EventBase & {
      type: 'ANIMATION_COMPLETED';
      animationId: string;
    })
  | (EventBase & {
      type: 'BEAT_COMPLETED';
      beatId: string;
      outcomeId: string;
    })
  | (EventBase & {
      type: 'BEAT_INTERRUPTED';
      beatId: string;
      reason: string;
    });

export type StoryEventType = StoryEvent['type'];

// ---------------------------------------------------------------------------
// Serializable conditions, effects, beats and dialog content
// ---------------------------------------------------------------------------

export type Condition =
  | { kind: 'all'; conditions: Condition[] }
  | { kind: 'any'; conditions: Condition[] }
  | { kind: 'not'; condition: Condition }
  | { kind: 'flag'; key: string; equals: boolean }
  | { kind: 'fact'; key: string; equals: string | number | boolean }
  | { kind: 'stageIs'; stage: NarrativeStage }
  | { kind: 'stageAtLeast'; stage: NarrativeStage }
  | { kind: 'characterAtLeast'; variable: CharacterVariable; value: number }
  | { kind: 'characterAtMost'; variable: CharacterVariable; value: number }
  | { kind: 'preferenceAtLeast'; tag: PreferenceTag; value: number }
  | { kind: 'beatCompleted'; beatId: string }
  | { kind: 'mutationActive'; mutationId: string };

export type StateEffect =
  | { kind: 'setFlag'; key: string; value: boolean }
  | { kind: 'setFact'; key: string; value: string | number | boolean }
  | { kind: 'adjustCharacter'; variable: CharacterVariable; delta: number }
  | { kind: 'adjustPreference'; tag: PreferenceTag; delta: number }
  | { kind: 'adjustTension'; delta: number }
  | { kind: 'setNarrativeStage'; stage: NarrativeStage }
  | { kind: 'appendInterestFact'; fact: string }
  | { kind: 'appendNotableInteraction'; description: string };

export type BeatStep =
  | { kind: 'line'; id: string; lineGroupId: string; interruptible?: boolean }
  | { kind: 'choices'; id: string; choiceGroupId: string }
  | { kind: 'setEra'; id: string; era: DesignEra; transitionId: string }
  | { kind: 'setEnvironment'; id: string; environmentId: string }
  | { kind: 'activateMutation'; id: string; mutationId: string; params?: Record<string, unknown> }
  | { kind: 'updateMutation'; id: string; mutationId: string; params: Record<string, unknown> }
  | { kind: 'deactivateMutation'; id: string; mutationId: string }
  | { kind: 'animation'; id: string; animationId: string; params?: Record<string, unknown> }
  | { kind: 'wait'; id: string; durationMs: number; interruptible?: boolean }
  | { kind: 'awaitEvent'; id: string; eventType: StoryEventType; timeoutMs?: number }
  | { kind: 'effects'; id: string; effects: StateEffect[] };

export type InterruptionPolicy =
  | 'ignore'
  | 'continue'
  | 'suspend-and-react'
  | 'revise'
  | 'abandon';

export interface NarrativeBeat {
  id: string;
  goal: string;
  description?: string;
  eligibleStages: NarrativeStage[];
  preconditions: Condition[];
  baseWeight: number;
  tensionMin?: number;
  tensionMax?: number;
  cooldownMs?: number;
  maxPerSession?: number;
  steps: BeatStep[];
  interruptions: Partial<Record<StoryEventType, InterruptionPolicy>>;
  outcomes: Record<string, StateEffect[]>;
}

export type DeliveryStyle =
  | 'normal' | 'typing' | 'hesitant' | 'interrupted' | 'self-correction' | 'immediate';

export interface DialogueLine {
  id: string;
  groupId: string;
  text: string;
  intentId: string;
  delivery: DeliveryStyle;
  conditions?: Condition[];
  effects?: StateEffect[];
  weight?: number;
  tags?: string[];
}

export interface DialogueChoice {
  id: string;
  text: string;
  intentId: string;
  effects: StateEffect[];
  conditions?: Condition[];
}

export interface DialogueChoiceGroup {
  id: string;
  choices: DialogueChoice[];
}

// ---------------------------------------------------------------------------
// Behavior and the explicit do-nothing choice
// ---------------------------------------------------------------------------

export type BehaviorIntent =
  | 'observe' | 'continueWorking' | 'experiment' | 'entertain'
  | 'seekApproval' | 'personalize' | 'selfCorrect' | 'hesitate'
  | 'interrupt' | 'apologize' | 'negotiate' | 'retreat'
  | 'requestAttention' | 'protectSession';

export type BehaviorAction =
  | { kind: 'none' }
  | { kind: 'line'; lineGroupId: string }
  | { kind: 'animation'; animationId: string; params?: Record<string, unknown> }
  | { kind: 'mutation'; mutationId: string; operation: 'activate' | 'update' | 'deactivate'; params?: Record<string, unknown> }
  | { kind: 'pauseBeat'; durationMs?: number }
  | { kind: 'resumeBeat' }
  | { kind: 'exitFlinch'; distancePx: number; durationMs: number };

export interface BehaviorDefinition {
  id: string;
  intent: BehaviorIntent;
  conditions: Condition[];
  relevantEvents: StoryEventType[];
  baseWeight: number;
  cooldownMs: number;
  maxPerSession?: number;
  maxPerStage?: number;
  action: BehaviorAction;
  expressiveTags?: string[];
}

export interface BehaviorCandidate {
  behaviorId: string | 'doNothing';
  score: number;
  eligible: boolean;
  reasons: string[];
}

export interface BehaviorDecision {
  chosenId: string | 'doNothing';
  candidates: BehaviorCandidate[];
  seedAfter: number;
}

// ---------------------------------------------------------------------------
// UI command boundary — only approved authored effects
// ---------------------------------------------------------------------------

export type UICommand =
  | { type: 'SHOW_MESSAGE'; lineId: string; delivery: DeliveryStyle }
  | { type: 'SHOW_CHOICES'; choiceGroupId: string }
  | { type: 'CLEAR_CHOICES' }
  | { type: 'CANCEL_TYPING' }
  | { type: 'SET_ERA'; era: DesignEra; transitionId: string }
  | { type: 'SET_ENVIRONMENT'; environmentId: string }
  | { type: 'ACTIVATE_MUTATION'; mutationId: string; params?: Record<string, unknown> }
  | { type: 'UPDATE_MUTATION'; mutationId: string; params: Record<string, unknown> }
  | { type: 'REMOVE_MUTATION'; mutationId: string }
  | { type: 'START_ANIMATION'; animationId: string; params?: Record<string, unknown> }
  | { type: 'PAUSE_ANIMATION'; animationId: string }
  | { type: 'RESUME_ANIMATION'; animationId: string }
  | { type: 'CANCEL_ANIMATION'; animationId: string }
  | { type: 'EXIT_FLINCH'; distancePx: number; durationMs: number }
  | { type: 'SHOW_TERMINATION'; variantId: string };

export interface CommandEnvelope {
  commandId: string;
  sessionId: string;
  atMs: number;
  command: UICommand;
}

// ---------------------------------------------------------------------------
// Design mutation registry: DOM-specific implementation lives in UI layer
// ---------------------------------------------------------------------------

export interface VisualMutationDefinition {
  id: string;
  family: DesignFamily;
  stageMin: NarrativeStage;
  tags: string[];
  requires?: string[];
  conflicts?: string[];
  maxInstances?: number;
  costTier: 1 | 2 | 3;
  reducedMotionAlternativeId?: string;
}

export interface MutationContext {
  host: HTMLElement;
  signal: AbortSignal;
  emit(event: StoryEvent): void;
  now(): number;
}

export interface VisualMutationInstance {
  update(params: Record<string, unknown>): void;
  suspend(): void;
  resume(): void;
  dispose(): void;
}

export interface VisualMutationFactory {
  definition: VisualMutationDefinition;
  mount(context: MutationContext, params?: Record<string, unknown>): VisualMutationInstance;
}

// ---------------------------------------------------------------------------
// Memory: versioned and bounded, not a saved runtime
// ---------------------------------------------------------------------------

export interface InheritedMemoryV1 {
  version: 1;
  updatedAtIso: string;
  summary: string; // enforce <= 100 words at runtime
  tags: string[];
  highlights: string[];
}

export const MEMORY_STORAGE_KEY = 'dont-go.memory.v1' as const;

// ---------------------------------------------------------------------------
// Engine dependencies, testability and lifecycle
// ---------------------------------------------------------------------------

export interface Clock {
  now(): number;
  schedule(delayMs: number, callback: () => void): () => void; // returns cancel fn
}

export interface RandomSource {
  next(): number; // uniformly in [0, 1), seeded in implementation
  getSeed(): number;
}

export interface NarrativeRuntime {
  getState(): Readonly<StoryState>;
  dispatch(event: StoryEvent): void;
  subscribe(listener: (state: Readonly<StoryState>) => void): () => void;
  onCommand(listener: (envelope: CommandEnvelope) => void): () => void;
  terminate(reason: TerminationReason): void;
  dispose(): void;
}

export interface RuntimeDependencies {
  clock: Clock;
  random: RandomSource;
  loadMemory(): InheritedMemoryV1 | null;
  saveMemory(memory: InheritedMemoryV1): void;
}

/**
 * Contractual rules to enforce in Runtime/SessionManager:
 * 1. EXIT_ACTIVATED must immediately take precedence over all other events.
 * 2. Once terminating/dead, no normal behavior, beat or design commands run.
 * 3. The short termination presentation may run only under SessionManager.
 * 4. visibilitychange(hidden) suspends but does not terminate.
 * 5. pagehide invalidates the runtime; pageshow(persisted) creates a new one.
 * 6. localStorage persists ONLY inherited memory, never StoryState or timers.
 * 7. The exit action cannot be disabled by a behavior or mutation.
 */
