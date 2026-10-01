-- Run with psql -v ON_ERROR_STOP=1 -f db/seed-portfolio.sql against an EMPTY demo database.
-- Public demo login: demo / BlinkDemo2026! (ordinary USER, never an administrator).
-- Refuses populated databases; never deletes or resets existing data.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$
DECLARE
  demo_id bigint; deniz_id bigint; ada_id bigint; ege_id bigint; selin_id bigint; arda_id bigint;
  welcome_id bigint; design_id bigint; coffee_id bigint; code_id bigint; photo_id bigint;
  book_id bigint; music_id bigint; weekend_id bigint; reply_id bigint;
  chat_id bigint; second_chat_id bigint;
BEGIN
  LOCK TABLE users IN EXCLUSIVE MODE;
  IF EXISTS (SELECT 1 FROM users) OR EXISTS (SELECT 1 FROM tweets) THEN
    RAISE EXCEPTION 'Portfolio seed requires an empty database. Existing data was not changed.';
  END IF;

  INSERT INTO users(username,email,password,role,token_version)
    VALUES ('demo','demo@example.test',crypt('BlinkDemo2026!',gen_salt('bf',10)),'USER',0) RETURNING id INTO demo_id;
  INSERT INTO users(username,email,password,role,token_version)
    VALUES ('deniz','deniz@example.test',crypt(gen_random_uuid()::text,gen_salt('bf',10)),'USER',0) RETURNING id INTO deniz_id;
  INSERT INTO users(username,email,password,role,token_version)
    VALUES ('ada','ada@example.test',crypt(gen_random_uuid()::text,gen_salt('bf',10)),'USER',0) RETURNING id INTO ada_id;
  INSERT INTO users(username,email,password,role,token_version)
    VALUES ('ege','ege@example.test',crypt(gen_random_uuid()::text,gen_salt('bf',10)),'USER',0) RETURNING id INTO ege_id;
  INSERT INTO users(username,email,password,role,token_version)
    VALUES ('selin','selin@example.test',crypt(gen_random_uuid()::text,gen_salt('bf',10)),'USER',0) RETURNING id INTO selin_id;
  INSERT INTO users(username,email,password,role,token_version)
    VALUES ('arda','arda@example.test',crypt(gen_random_uuid()::text,gen_salt('bf',10)),'USER',0) RETURNING id INTO arda_id;

  INSERT INTO tweets(user_id,content,created_at,deleted) VALUES
    (demo_id,'Blink’e hoş geldin! Burası örnek içeriklerle hazırlanmış bir portfolyo ortamı. Gönderileri keşfedebilir, birini takip edebilir veya kendi hesabını açarak sohbete katılabilirsin.',now()-interval '3 days',false) RETURNING id INTO welcome_id;
  INSERT INTO tweets(user_id,content,created_at,deleted) VALUES
    (ada_id,'Bir arayüzü sadeleştirirken ilk baktığım şey: Kullanıcı bir sonraki adımını anlayabiliyor mu? Bazen en iyi tasarım kararı bir butonu kaldırmak oluyor.',now()-interval '2 days 5 hours',false) RETURNING id INTO design_id;
  INSERT INTO tweets(user_id,content,created_at,deleted) VALUES
    (deniz_id,'Sabah kahvesi, açık bir pencere ve yarım kalan bir kitap. Bugünün küçük mutluluğu bu. Sizin güne başlama ritüeliniz ne?',now()-interval '2 days',false) RETURNING id INTO coffee_id;
  INSERT INTO tweets(user_id,content,created_at,deleted) VALUES
    (ege_id,'Bugün bir hatayı çözmekten daha güzel bir şey yaptım: Neden oluştuğunu anlatan bir test yazdım. Gelecekteki kendime küçük bir iyilik.',now()-interval '1 day 8 hours',false) RETURNING id INTO code_id;
  INSERT INTO tweets(user_id,content,created_at,deleted) VALUES
    (selin_id,'Fotoğraf yürüyüşünde bu kez tek bir renge odaklandım: sarı. Her gün geçtiğim sokakta ne kadar çok ayrıntıyı kaçırdığımı fark ettim.',now()-interval '1 day',false) RETURNING id INTO photo_id;
  INSERT INTO tweets(user_id,content,created_at,deleted) VALUES
    (arda_id,'Okuma listemi büyütmek yerine bu ay yarım bıraktığım bir kitabı bitirmeye karar verdim. Son sayfasından sonra da düşündüren kitap önerilerinizi alırım.',now()-interval '18 hours',false) RETURNING id INTO book_id;
  INSERT INTO tweets(user_id,content,created_at,deleted) VALUES
    (deniz_id,'Çalışırken sözsüz müzik mi, tam sessizlik mi? Ben yağmur sesiyle başlayıp bir şekilde caz listesine geçiyorum.',now()-interval '8 hours',false) RETURNING id INTO music_id;
  INSERT INTO tweets(user_id,content,created_at,deleted) VALUES
    (demo_id,'Hafta sonu planım: yeni bir yürüyüş rotası, güzel bir kahve ve telefondan biraz uzaklaşmak. Yakın çevrende yeniden keşfettiğin bir yer var mı?',now()-interval '3 hours',false) RETURNING id INTO weekend_id;

  INSERT INTO tweets(user_id,content,parent_tweet_id,created_at,deleted) VALUES
    (demo_id,'Ben önce kısa bir yürüyüş yapıyorum. Kahveye dönünce gün gerçekten başlamış gibi geliyor.',coffee_id,now()-interval '1 day 23 hours',false) RETURNING id INTO reply_id;
  INSERT INTO tweets(user_id,content,parent_tweet_id,created_at,deleted) VALUES
    (deniz_id,'Güzel fikir! Yarın kahveyi yürüyüşten sonraya bırakacağım.',reply_id,now()-interval '1 day 22 hours',false),
    (ege_id,'Kesinlikle. Hata mesajının ne yapılacağını söylemesi de en az ekranın görünümü kadar önemli.',design_id,now()-interval '2 days 3 hours',false),
    (ada_id,'O test, altı ay sonra projeyi yeniden açtığında en iyi notun olacak.',code_id,now()-interval '1 day 6 hours',false),
    (selin_id,'Sahil yoluna erken saatte gitmek! Aynı yer ama ışık ve sessizlik tamamen farklı.',weekend_id,now()-interval '2 hours',false);

  INSERT INTO likes(user_id,tweet_id) VALUES
    (deniz_id,welcome_id),(ada_id,welcome_id),(ege_id,welcome_id),(selin_id,welcome_id),
    (demo_id,design_id),(ege_id,design_id),(arda_id,design_id),
    (ada_id,coffee_id),(selin_id,coffee_id),(demo_id,code_id),(ada_id,code_id),
    (deniz_id,photo_id),(arda_id,photo_id),(selin_id,book_id),(ege_id,music_id),(deniz_id,weekend_id);
  INSERT INTO retweets(user_id,tweet_id,created_at) VALUES
    (demo_id,design_id,now()-interval '1 day 20 hours'),
    (selin_id,welcome_id,now()-interval '2 days'),(arda_id,code_id,now()-interval '1 day 5 hours');
  INSERT INTO follows(follower_id,following_id,created_at) VALUES
    (demo_id,deniz_id,now()-interval '3 days'),(demo_id,ada_id,now()-interval '3 days'),
    (deniz_id,demo_id,now()-interval '3 days'),(ada_id,demo_id,now()-interval '3 days'),
    (selin_id,demo_id,now()-interval '2 days'),(ege_id,ada_id,now()-interval '2 days'),
    (arda_id,ege_id,now()-interval '2 days'),(ada_id,selin_id,now()-interval '1 day');

  INSERT INTO conversations(first_user_id,second_user_id,updated_at)
    VALUES (LEAST(demo_id,deniz_id),GREATEST(demo_id,deniz_id),now()-interval '40 minutes') RETURNING id INTO chat_id;
  INSERT INTO messages(conversation_id,sender_id,content,created_at,read_at) VALUES
    (chat_id,deniz_id,'Merhaba! Blink’in örnek sohbetine hoş geldin.',now()-interval '4 hours',now()-interval '3 hours'),
    (chat_id,demo_id,'Merhaba Deniz! Akıştaki kahve sohbetini görünce buraya da uğradım.',now()-interval '3 hours',now()-interval '2 hours'),
    (chat_id,deniz_id,'Buradaki konuşma örnek olarak hazırlandı. Kendi hesabınla diğer kullanıcılara da mesaj gönderebilirsin.',now()-interval '40 minutes',null);
  INSERT INTO conversations(first_user_id,second_user_id,updated_at)
    VALUES (LEAST(demo_id,ada_id),GREATEST(demo_id,ada_id),now()-interval '1 hour') RETURNING id INTO second_chat_id;
  INSERT INTO messages(conversation_id,sender_id,content,created_at,read_at) VALUES
    (second_chat_id,ada_id,'Selam! Tasarım üzerine yazdığım gönderiye bıraktığın beğeni için teşekkürler.',now()-interval '5 hours',now()-interval '4 hours'),
    (second_chat_id,demo_id,'Küçük ayrıntıların deneyimi değiştirmesine ben de katılıyorum.',now()-interval '4 hours',now()-interval '3 hours'),
    (second_chat_id,ada_id,'Özellikle anlaşılır geri bildirimler. Kullanıcının bir işlemin tamamlandığını görebilmesi çok önemli.',now()-interval '1 hour',null);
END $$;
COMMIT;
