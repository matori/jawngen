import assert, { strictEqual } from 'assert';
import fs from 'fs';
import path from 'path';
import { parse } from 'jawn-to-ast';
import { html } from '../src/html';

describe('HTMLジェネレーターのテスト', function() {

  describe('fixture/common-input.jwn からの生成チェック', function() {
    const fixturePath = path.resolve(__dirname, `./fixture/common-input.jwn`);
    const fixture = fs.readFileSync(fixturePath, 'utf-8');
    const AST = parse(fixture);
    // ホワイトスペース、ルビ文字、ルビ括弧を除いた文字数。
    const count = 129;

    context('すべてのオプションが初期値', function() {
      const expectedPath = path.resolve(__dirname, `./expected/html-output.html`);
      const expected = fs.readFileSync(expectedPath, 'utf-8');
      const result = html(AST);

      it('文字数は同じか', function() {
        strictEqual(result.content.length, expected.length);
      });

      it('コンテンツは一致しているか', function() {
        strictEqual(result.content, expected);
      });

      it('算出文字数は想定どおりか', function() {
        strictEqual(result.count, count);
      });
    });

    context('{ pretty: true }', function() {
      const expectedPath = path.resolve(__dirname, `./expected/html-output-pretty.html`);
      const expected = fs.readFileSync(expectedPath, 'utf-8');
      const result = html(AST, { pretty: true });

      it('文字数は同じか', function() {
        strictEqual(result.content.length, expected.length);
      });

      it('コンテンツは一致しているか', function() {
        strictEqual(result.content, expected);
      });

      it('算出文字数は想定どおりか', function() {
        strictEqual(result.count, count);
      });
    });

    context(`{ lineIdPrefix: 'L' }`, function() {
      const expectedPath = path.resolve(__dirname, `./expected/html-output-line-id-prefix.html`);
      const expected = fs.readFileSync(expectedPath, 'utf-8');
      const result = html(AST, { lineIdPrefix: 'L' });

      it('文字数は同じか', function() {
        strictEqual(result.content.length, expected.length);
      });

      it('コンテンツは一致しているか', function() {
        strictEqual(result.content, expected);
      });

      it('算出文字数は想定どおりか', function() {
        strictEqual(result.count, count);
      });
    });

    context(`{ rubyParenthesis: ['<', '>'] }`, function() {
      const expectedPath = path.resolve(__dirname, `./expected/html-output-custom-parenthesis.html`);
      const expected = fs.readFileSync(expectedPath, 'utf-8');
      const result = html(AST, { rubyParenthesis: ['<', '>'] });

      it('文字数は同じか', function() {
        strictEqual(result.content.length, expected.length);
      });

      it('コンテンツは一致しているか', function() {
        strictEqual(result.content, expected);
      });

      it('算出文字数は想定どおりか', function() {
        strictEqual(result.count, count);
      });
    });
  });

  describe('特定ケースの構文チェック', function() {

    describe(`不正なASTを渡したときに正しくエラーが投げられるか`, function() {

      context(`ルートのタイプがDocumentではない`, function() {
        const AST = parse('');
        AST.type = 'foo';
        it('エラーが投げられているか', function() {
          assert.throws(() => html(AST), Error, '不正なASTです。');
        });
      });

      context(`ルートがchildrenを持たないAST`, function() {
        const AST = parse('');
        delete AST.children;
        it('エラーが投げられているか', function() {
          assert.throws(() => html(AST), Error, '不正なASTです。');
        });
      });
    });

    describe(`エスケープのテスト`, function() {
      const input = `<'&">`;
      const AST = parse(input);
      const { content } = html(AST);

      it(`<'&"> はエスケープされているか`, function() {
        strictEqual(content, `<p>&lt;&#39;&amp;&quot;&gt;</p>`);
      });
    });

    describe(`改行のテスト`, function() {
      const input = `\n\n\n`;
      const AST = parse(input);
      const { content } = html(AST);

      it(`\\n\\n\\n は正しく空白パラグラフ3つになっているか`, function() {
        strictEqual(content, `<p><br></p><p><br></p><p><br></p>`);
      });
    });
  });
});

