import { toConfigKey } from '@/lib/format';
import type { SkillGroup } from '@/lib/schemas';

export function SkillsConfig({ groups }: { groups: SkillGroup[] }) {
  return (
    <dl className="border-border bg-surface space-y-3 rounded-lg border p-5 font-mono text-sm">
      {groups.map((group) => (
        <div key={group.label} className="sm:flex sm:gap-2">
          <dt className="text-accent shrink-0">{toConfigKey(group.label)}:</dt>
          <dd className="text-fg">[{group.items.join(', ')}]</dd>
        </div>
      ))}
    </dl>
  );
}
