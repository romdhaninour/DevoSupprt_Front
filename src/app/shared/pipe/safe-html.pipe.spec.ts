import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SafeHtmlPipe } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SafeHtmlPipe]
    });
    pipe = TestBed.inject(SafeHtmlPipe);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform a simple HTML string', () => {
    const result = pipe.transform('<div>Hello</div>');
    expect(result).toBeTruthy();
  });

  it('should return a SafeHtml value', () => {
    const result = pipe.transform('<b>Bold</b>');
    expect(result).toBeTruthy();
  });

  it('should handle empty string', () => {
    const result = pipe.transform('');
    expect(result).toBeTruthy();
  });

  it('should handle HTML with attributes', () => {
    const result = pipe.transform('<a href="http://example.com">Link</a>');
    expect(result).toBeTruthy();
  });

  it('should handle complex HTML', () => {
    const complexHtml = '<div class="test"><span style="color:red">Nested</span><ul><li>Item</li></ul></div>';
    const result = pipe.transform(complexHtml);
    expect(result).toBeTruthy();
  });
});
