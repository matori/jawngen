import { TxtNode, TxtParentNode } from '@textlint/ast-node-types';
import { Syntax } from 'jawn-to-ast';
import escapeHtml from 'escape-html';
import { traverse, VisitorOption } from '@textlint/ast-traverse';
import { generateSyntaxResult } from './interface';

interface generatorOptions {
  pretty?: boolean,
  lineIdPrefix?: string,
  rubyParenthesis?: string[],
}

/**
 * オプションのデフォルト値。
 */
const defaultOptions: generatorOptions = {
  pretty: false,
  lineIdPrefix: '',
  rubyParenthesis: ['（', '）'],
};

function html(originalAST: TxtNode, options: generatorOptions = {}): generateSyntaxResult {
  const {
    Document,
    Break,
    Emphasis,
    Ruby,
    RubyParenthesis,
    RubyText,
    Str,
  } = Syntax;

  if (originalAST.type !== Document || !Array.isArray(originalAST.children)) {
    throw new Error('不正なASTです。');
  }
  const AST = originalAST as TxtParentNode;

  const pretty = typeof options.pretty === 'boolean' ? options.pretty : defaultOptions.pretty!;
  const lineIdPrefix = options.lineIdPrefix ? options.lineIdPrefix : defaultOptions.lineIdPrefix!;
  const rubyParenthesis = Array.isArray(options.rubyParenthesis) && options.rubyParenthesis.length === 2
    ? options.rubyParenthesis
    : defaultOptions.rubyParenthesis!;

  const rubyParenthesisStart = escapeHtml(rubyParenthesis[0]);
  const rubyParenthesisEnd = escapeHtml(rubyParenthesis[1]);

  const contents: string[] = [];
  let lineNumber = 0;
  let count = 0;
  let previousDocumentChild: TxtNode | null = null;
  let rubyParenthesisOpened = false;

  traverse(AST, {
    enter(node, parent) {
      const nodeType = node.type;
      const parentType: string = parent ? parent.type : '';

      if (needParagraphTag(nodeType, previousDocumentChild)) {
        lineNumber = lineNumber + 1;
        const openTag = lineIdPrefix ? `<p id="${lineIdPrefix}${lineNumber}">` : `<p>`;
        contents.push(openTag);
        if (nodeType === Break) {
          contents.push('<br>');
        }
      }

      if (nodeType === Emphasis) {
        contents.push('<em>');
      }

      if (nodeType === Ruby) {
          contents.push('<ruby>');
      }

      if (nodeType === RubyParenthesis) {
        contents.push('<rp>');
        if (!rubyParenthesisOpened) {
          contents.push(rubyParenthesisStart);
          rubyParenthesisOpened = true;
        } else {
          contents.push(rubyParenthesisEnd);
          rubyParenthesisOpened = false;
        }
      }

      if (nodeType === RubyText) {
        contents.push('<rt>');
      }

      if (nodeType === Str && parentType !== RubyParenthesis) {
        const { value } = node;
        if (value) {
          const text = escapeHtml(value);
          contents.push(text);

          if (parentType !== RubyText) {
            const removeWhiteSpace = value.replace(/[\s　]+/g, '');
            count = count + [...removeWhiteSpace].length;
          }
        }
      }
    },

    leave(node, parent) {
      const nodeType = node.type;
      const parentType: string = parent ? parent.type : '';

      if (nodeType === Emphasis) {
        contents.push('</em>');
      }

      if (nodeType === Ruby) {
        contents.push('</ruby>');
      }

      if (nodeType === RubyParenthesis) {
        contents.push('</rp>');
      }

      if (nodeType === RubyText) {
        contents.push('</rt>');
      }

      // pタグで閉じる必要があるものは閉じる
      if (needParagraphTag(nodeType, previousDocumentChild)) {
        contents.push('</p>');
      }

      // 整形用の改行コード
      const breakCode = formatBreak(pretty, node, previousDocumentChild);
      if (breakCode) {
        contents.push(breakCode);
      }

      if (parentType === Document) {
        previousDocumentChild = node;
      }
    },
  });

  return {
    content: contents.join(''),
    count,
    warnings: [],
  };
}

/**
 * pタグを閉じるかどうかを判定する。
 * @param {string} nodeType
 * @param {TxtNode|null} previousNode
 * @return {boolean}
 */
function needParagraphTag(nodeType: string, previousNode: TxtNode | null): boolean {
  const { Break, Paragraph } = Syntax;
  if (nodeType === Break && (!previousNode || previousNode.type === Break)) {
    return true;
  }
  return nodeType === Paragraph;
}

/**
 * 整形用の改行コードを作成する。
 * @param {boolean} pretty ジェネレーターの整形オプションを渡す。
 * @param {TxtNode} node 現在のノード。
 * @param {TxtNode|null} previousNode 1つ前のノード。
 * @return {string} 改行コードまたは空文字
 */
function formatBreak(pretty: boolean, node: TxtNode, previousNode: TxtNode | null): string {
  const { Break, Comment } = Syntax;
  if (pretty && node.type === Break && (!previousNode || previousNode.type !== Comment)) {
    return node.raw;
  }
  return '';
}

export { html };
