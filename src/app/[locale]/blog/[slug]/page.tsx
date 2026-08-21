import { makeArticlePage } from '../../../../components/articles/article-page';

const { generateStaticParams, generateMetadata, Page } = makeArticlePage('blog', 'blog');
export { generateStaticParams, generateMetadata };
export default Page;
