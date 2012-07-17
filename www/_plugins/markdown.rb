module Jekyll

  class MarkdownTag < Liquid::Block
    def initialize(tag_name, markup, tokens)
      super
      @markup = markup
    end

    def render(context)
        content = super
        site = context.registers[:site]
        converter = site.getConverterImpl(Jekyll::MarkdownConverter)
        converter.convert(content) 
    end
  end

end

Liquid::Template.register_tag('markdown', Jekyll::MarkdownTag)
