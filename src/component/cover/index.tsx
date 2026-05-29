import {
  BRIDE_FULLNAME,
  GROOM_FULLNAME,
  LOCATION,
  WEDDING_DATE,
  WEDDING_DATE_FORMAT,
} from "../../const"
import { COVER_IMAGE } from "../../images"
import { LazyDiv } from "../lazyDiv"
import { Lightbox } from "../lightbox"
import { useModal } from "../modal"

const DAY_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

export const Cover = () => {
  const { openModal, closeModal } = useModal()

  return (
    <LazyDiv className="card cover">
      <div className="wedding-date">
        {WEDDING_DATE.format("YYYY")}
        <div className="divider" />
        {WEDDING_DATE.format("MM")}
        <div className="divider" />
        {WEDDING_DATE.format("DD")}
      </div>
      <div className="wedding-day-of-week">
        {DAY_OF_WEEK[WEDDING_DATE.day()]}
      </div>
      <div className="image-wrapper">
        <button
          className="cover-image-button"
          onClick={() =>
            openModal({
              className: "cover-lightbox-modal",
              closeOnClickBackground: true,
              content: (
                <Lightbox
                  images={[COVER_IMAGE]}
                  loop={false}
                  showCounter={false}
                  onRequestClose={closeModal}
                />
              ),
            })
          }
          aria-label="Open cover image"
        >
          <img src={COVER_IMAGE} alt="sample" loading="lazy" />
        </button>
      </div>
      <div className="subtitle">Save the date for the wedding of</div>
      <div className="names">
        {GROOM_FULLNAME}
        <div className="divider" />
        {BRIDE_FULLNAME}
      </div>
      <div className="info">{WEDDING_DATE.format(WEDDING_DATE_FORMAT)}</div>
      <div className="info">{LOCATION}</div>
    </LazyDiv>
  )
}
