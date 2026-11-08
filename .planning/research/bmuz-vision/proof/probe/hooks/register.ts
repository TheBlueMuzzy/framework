import type { Register } from 'claude-code'

const lines: string[] = []
let fired = false
const waiting: Record<string, boolean> = {}

async function log($: any, s: string) {
  lines.push(`${await $.clock.now()} ${s}`)
  await $.fs.write('probe.log', lines.join('\n') + '\n')
}

async function kick($: any) {
  const mode = (await $.env.get('PROBE_MODE')) ?? 'cmd'
  await log($, `kick mode=${mode}`)
  try {
    if (mode === 'cmd') {
      const r = await $.command.run({ command: 'probe:hello-flow', args: '{"name":"Moon Goat","out":"hello-cmd.html"}' })
      await log($, `command.run -> ${JSON.stringify(r).slice(0, 600)}`)
    } else if (mode === 'slash') {
      const r = await $.prompt.submit({ text: '/probe:hello-flow {"name":"Moon Goat","out":"hello-slash.html"}' })
      await log($, `prompt.submit slash -> ${JSON.stringify(r).slice(0, 300)}`)
    } else if (mode === 'model') {
      const r = await $.prompt.submit({ text: 'BMUZ engine step 4 (flow): call the Workflow tool with name "probe:hello-flow" and args {"name":"Moon Goat","out":"hello-model.html"}. Do nothing else.' })
      await log($, `prompt.submit model -> ${JSON.stringify(r).slice(0, 300)}`)
    } else if (mode === 'spawn') {
      const r = await $.agent.spawn({ prompt: 'Use the Write tool to create hello-spawn.html containing exactly <h1>Hello Moon Goat</h1>. Then reply with exactly: DONE Moon Goat', description: 'bmuz flow step', model: 'haiku' } as any)
      await log($, `agent.spawn -> ${JSON.stringify(r)}`)
      if (r.agentId) waiting[r.agentId] = true
    }
  } catch (err) {
    await log($, `kick threw: ${String(err)}`)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await log($, `session.start`)
    return r
  })

  on('prompt.submit', async ($, e, next) => {
    await log($, `prompt.submit origin=${JSON.stringify((e as any).origin)} cmd=${JSON.stringify((e as any).command)} text=${String((e as any).text).slice(0, 80)}`)
    return next(e)
  })

  on('command.run', async ($, e, next) => {
    await log($, `command.run hook cmd=${(e as any).command} args=${(e as any).args} origin=${JSON.stringify((e as any).origin)}`)
    const r = await next(e)
    await log($, `command.run hook result ${JSON.stringify(r).slice(0, 400)}`)
    return r
  })

  on('session.append', async ($, e, next) => {
    const m: any = (e as any).message
    const door = (e as any).door
    const skip = door === 'attachment' && /environment|deferred|agent_listing|mcp_instr|skill_listing|instructions|session_context|date|prompt_snapshot|total_tokens|model|credential|remote_session/.test(String(m.name))
    if (!skip && door !== 'hook-context') {
      const txt = JSON.stringify(m.content).slice(0, 400)
      await log($, `append door=${door} agent=${(e as any).agentId} origin=${JSON.stringify((e as any).origin)} type=${m.type} name=${m.name} ${txt}`)
    }
    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const r = await next(e)
    await log($, `agent.spawn hook wf=${JSON.stringify((e as any).workflow)} -> ${JSON.stringify(r)}`)
    return r
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    const id = (e as any).agentId
    await log($, `turn.complete agent=${id} waited=${!!(id && waiting[id])} answer=${String((e as any).answer).slice(0, 160)}`)
    if (!id && !fired) {
      fired = true
      await kick($)
    }
    return r
  })
}
