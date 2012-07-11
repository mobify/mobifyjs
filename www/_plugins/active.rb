module Jekyll

  class ActiveTag < Liquid::Block
    def initialize(tag_name, prefix, tokens)
      super
      @prefix = prefix.strip() != ""
    end

    def render(context)
        content = super
        rawUrl = context['page']['url']
        baseUrl = context['site']['baseurl'] or "/"

        url = baseUrl + rawUrl.sub(/index.html$/, "")

        aTags = /<a\s+href="(.*?)">/

        newContent = content.gsub /<a\s+href="([^"]*?)"(\s+class="([^"]*?)")?/xi do | match |
            linkUrl = $1
            classes = $3
            if (linkUrl == url) or (@prefix and (url.match /^#{linkUrl}/) != nil)
                "<a href=\"#{linkUrl}\" class=\"active #{classes or ''}\""
            else
                match
            end
        end

        newContent
    end
  end

end

Liquid::Template.register_tag('active_links', Jekyll::ActiveTag)
