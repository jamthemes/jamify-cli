import { JSDOM } from 'jsdom';
import { componentsFromDocuments } from './index';

it('Should create components from HTML', async () => {
  const html1 = `
    <div class="box glow">
      <div class="active inner">
        <div class="profile">
          <img src="person01.jpg"></img>
        </div>
        <div class="info">
          Programmer
        </div>
      </div>
    </div>
  `;
  const html2 = `
    <div class="box">
      <div class="inactive inner">
        <div class="profile">
          <img src="person02.jpg"></img>
        </div>
        <div class="info">
          Software Engineer
        </div>
      </div>
    </div>
  `;

  const jsdom1 = new JSDOM(html1);
  const jsdom2 = new JSDOM(html2);
  await componentsFromDocuments([
    jsdom1.window.document,
    jsdom2.window.document,
  ]);
});
