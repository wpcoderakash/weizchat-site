import { makeArticleIndex } from '../../../components/articles/article-list';

const { generateMetadata, Page } = makeArticleIndex('blog', 'blog');
export { generateMetadata };
export default Page;
