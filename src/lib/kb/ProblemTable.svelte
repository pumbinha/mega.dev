<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { groupByProblem, PROBLEMS } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket, repo = 'https://github.com/pumbinha/mega.dev' }: { ticket: number; repo?: string } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByProblem(merged, tenantOf));
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr class:unplaced={g.problem === 'unplaced'}>
        <td><code>{g.problem}</code> {g.problem === 'unplaced' ? 'no tenant on file' : PROBLEMS[g.problem].title}</td>
        <td>{g.reports.length}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if g.problem === 'unplaced'}none yet{:else}<a href="{repo}/issues/{PROBLEMS[g.problem].issue}">#{PROBLEMS[g.problem].issue}</a>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#each groups.filter((g) => g.problem === 'shift') as g (g.problem)}
  <p class="note">The {g.reports.length} <code>shift</code> reports are also counted under their tenant's cause, as the desk files them.</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .note { color: var(--muted); font-size: 0.85em; }
  .unplaced td { background: var(--warn-bg); }
</style>
