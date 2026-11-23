import { VoiceSpeaker } from './VoiceSpeaker'

/** The voices of the other players with their mic on. */
export function VoiceSpeakers({ remote }: { remote: ReadonlyMap<string, MediaStream> }) {
  return (
    <div hidden>
      {[...remote].map(([id, stream]) => (
        <VoiceSpeaker key={id} stream={stream} />
      ))}
    </div>
  )
}
