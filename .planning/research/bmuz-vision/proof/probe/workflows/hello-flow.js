export const meta = {
  name: 'hello-flow',
  description: 'Writes hello.html containing the game name',
}
let a = args
if (typeof a === 'string') { try { a = JSON.parse(a) } catch (e) { a = { name: a } } }
const name = (a && a.name) || 'NO-NAME'
const out = (a && a.out) || 'hello.html'
log(`args type=${typeof args} value=${JSON.stringify(args)}`)
const r = await agent(`Use the Write tool to create the file ${out} (relative to the current working directory) containing exactly: <h1>Hello ${name}</h1>. Then reply with just the word written.`, { model: 'haiku', label: 'write hello' })
return { wrote: out, name, argsType: typeof args, agentSaid: r }
