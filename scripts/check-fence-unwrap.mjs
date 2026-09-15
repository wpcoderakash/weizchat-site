/**
 * The fence-unwrap rule, asserted.
 *
 * It exists because a pasted document can arrive wrapped in its own
 * ```markdown fence and then renders as one code sample. The risk of the fix
 * is the opposite mistake: eating a fence that a document legitimately uses to
 * show a code sample. Both directions are checked here.
 */
import { unwrapPastedFence } from '../src/cms/markdown.ts';

let fails = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fails++;
};

const doc = '## **Introduction**\n\nSome text.\n\n| a | b |\n| --- | --- |\n| 1 | 2 |';

check('unwraps a ```markdown wrapper', unwrapPastedFence('```markdown\n' + doc + '\n```') === doc);
check('unwraps a bare ``` wrapper', unwrapPastedFence('```\n' + doc + '\n```') === doc);
check(
  'unwraps despite surrounding blank lines',
  unwrapPastedFence('\n\n```markdown\n' + doc + '\n```\n\n') === doc,
);

const plain = doc;
check('leaves an ordinary document alone', unwrapPastedFence(plain) === plain);

const withSample = '# Guide\n\nRun this:\n\n```bash\nnpm install\n```\n\nThen read on.';
check('leaves an embedded code sample alone', unwrapPastedFence(withSample) === withSample);

const startsWithSample = '```bash\nnpm install\n```\n\nThat was the command.';
check('leaves a document that opens with a sample alone', unwrapPastedFence(startsWithSample) === startsWithSample);

const twoSamples = '```js\na\n```\n\ntext\n\n```js\nb\n```';
check('leaves two samples alone', unwrapPastedFence(twoSamples) === twoSamples);

check('survives an empty body', unwrapPastedFence('') === '');

console.log(fails === 0 ? '\nFENCE-UNWRAP CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
