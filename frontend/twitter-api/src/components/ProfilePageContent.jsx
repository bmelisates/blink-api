import Sidebar from '../pages/Sidebar'
import SearchUser from '../pages/SearchUser'
import FollowSuggestions from '../pages/FollowSuggestions'
import EditTweetModal from './EditTweetModal'
import ProfileHeader from './ProfileHeader'
import ProfileTabs from './ProfileTabs'
import TweetList from './TweetList'

export default function ProfilePageContent({ user, action, timeline, currentUserId, tweetCard, handlers }) {
  return (
    <div className="profile-container">
      <Sidebar />

      <main className="profile-main">
        <ProfileHeader user={user} action={action} />
        <ProfileTabs />

        <EditTweetModal
          editingTweet={timeline.editingTweet}
          editContent={timeline.editContent}
          setEditContent={timeline.setEditContent}
          onCancel={timeline.cancelEditing}
          onSave={timeline.saveEditing}
        />

        <div className="profile-tweets">
          <TweetList
            items={timeline.timelineItems}
            currentUserId={currentUserId}
            tweetCard={tweetCard}
            handlers={handlers}
          />
        </div>
      </main>

      <aside className="right-sidebar">
        <SearchUser />
        <FollowSuggestions />
      </aside>
    </div>
  )
}
