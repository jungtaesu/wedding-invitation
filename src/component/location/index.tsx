import { Map } from "./map"
import CarIcon from "../../icons/car-icon.svg?react"
import BusIcon from "../../icons/bus-icon.svg?react"
import { LazyDiv } from "../lazyDiv"
import { LOCATION, LOCATION_ADDRESS } from "../../const"

export const Location = () => {
  return (
    <>
      <LazyDiv className="card location">
        <h2 className="english">Location</h2>
        <div className="addr">
          {LOCATION}
          <div className="detail">{LOCATION_ADDRESS}</div>
        </div>
        <Map />
      </LazyDiv>
      <LazyDiv className="card location">
        <div className="location-info">
          <div className="transportation-icon-wrapper">
            <BusIcon className="transportation-icon" />
          </div>
          <div className="heading">대중교통</div>
          <div />
          <div className="content" style={{whiteSpace: 'nowrap'}}>
            <br />
            <b>2호선 낙성대역 4번출구 </b>
            → 첫번째 골목 끼고 좌회전
            <br />→ 마을버스 <b>관악 02번</b> 승차
            <br />→ <b>제2공학관(종점)</b> 하차
            <br />
            <br />
             <b>2호선 서울대 입구역 3번출구 </b>
            <br />→ 마을버스 <b>5511, 5513 </b> 승차
            <br />→ <b>제2공학관(종점)</b> 하차
                        <br />
                        <br />
             <b>신림선 관악산역 3번출구 </b>
             → 버스정류장 도보 이동
            <br />→ 마을버스 <b>5511, 5516 </b> 승차
            <br />→ <b>제2공학관(종점)</b> 하차
          </div>
          <div />
        </div>
        <div className="location-info">
          <div className="transportation-icon-wrapper">
            <CarIcon className="transportation-icon" />
          </div>
          <div className="heading">자가용</div>
          <div />
          <div className="content">
            네이버 지도, 카카오 네비, 티맵 등 이용
            <br />
            <b>이라운지 서울대점</b> 검색
            <br />
            - 출차 시 직원에게 2시간 무료 주차권 수령후 출차 (이후 분당 500원) 
            <br />
          </div>
          <div />
          <div className="content">
          </div>
        </div>
      </LazyDiv>
    </>
  )
}
