import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksGallery extends Struct.ComponentSchema {
  collectionName: 'components_blocks_galleries';
  info: {
    displayName: 'Gallery';
  };
  attributes: {
    caption: Schema.Attribute.String;
    items: Schema.Attribute.Media<'images', true>;
  };
}

export interface BlocksIFrameEmbed extends Struct.ComponentSchema {
  collectionName: 'components_blocks_i_frame_embeds';
  info: {
    displayName: 'IFrame embed';
  };
  attributes: {
    allow: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'>;
    sandbox: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'allow-scripts allow-same-origin'>;
    src: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface BlocksImage extends Struct.ComponentSchema {
  collectionName: 'components_blocks_images';
  info: {
    displayName: 'Image';
  };
  attributes: {
    caption: Schema.Attribute.String;
    media: Schema.Attribute.Media<'images'>;
  };
}

export interface BlocksRichText extends Struct.ComponentSchema {
  collectionName: 'components_blocks_rich_texts';
  info: {
    displayName: 'Rich text';
  };
  attributes: {
    content: Schema.Attribute.Blocks;
  };
}

export interface BlocksVideoEmbed extends Struct.ComponentSchema {
  collectionName: 'components_blocks_video_embeds';
  info: {
    displayName: 'Video embed';
  };
  attributes: {
    provider: Schema.Attribute.Enumeration<['youtube', 'vimeo']>;
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blocks.gallery': BlocksGallery;
      'blocks.i-frame-embed': BlocksIFrameEmbed;
      'blocks.image': BlocksImage;
      'blocks.rich-text': BlocksRichText;
      'blocks.video-embed': BlocksVideoEmbed;
    }
  }
}
